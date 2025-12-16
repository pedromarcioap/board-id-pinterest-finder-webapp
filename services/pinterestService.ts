import { BoardData } from '../types';

/**
 * Helper to extract meta tag content from HTML string
 */
const getMeta = (html: string, property: string): string | undefined => {
  const regex = new RegExp(`<meta property="${property}" content="([^"]+)"`, 'i');
  const match = html.match(regex);
  return match ? match[1].replace(' | Pinterest', '') : undefined;
};

/**
 * Recursively searches for a key in a deep object/array
 */
const findKeyInObject = (obj: any, keyToFind: string): string | null => {
  if (!obj || typeof obj !== 'object') return null;

  if (keyToFind in obj && obj[keyToFind]) {
    return String(obj[keyToFind]);
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const result = findKeyInObject(obj[key], keyToFind);
      if (result) return result;
    }
  }
  return null;
};

/**
 * Validates if a string looks like a Pinterest Board ID (numeric, usually 15+ digits)
 */
const isValidId = (id: string | undefined | null): boolean => {
  if (!id) return false;
  // Board IDs are numeric strings. Usually long, but we accept anything numeric > 5 digits to be safe.
  return /^\d{6,}$/.test(id);
};

/**
 * Extracts the Board ID from a Pinterest URL.
 * Uses multiple CORS proxies to fetch the HTML content to ensure reliability.
 */
export const extractBoardId = async (url: string): Promise<BoardData> => {
  // 1. Basic Validation
  if (!url.includes('pinterest.com')) {
    throw new Error('Por favor, insira uma URL válida do Pinterest.');
  }

  // Remove query params and trailing slashes
  let cleanUrl = url.split('?')[0];
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  let htmlContent = '';

  // 2. Fetching Strategy with Redundancy
  const tryFetch = async (proxyUrl: string, isJsonWrapper = false): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      if (isJsonWrapper) {
        const json = await response.json();
        if (!json.contents) throw new Error('Empty content from proxy');
        return json.contents;
      }
      
      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const attempts = [
    // Attempt 1: AllOrigins (JSON wrapped)
    () => tryFetch(`https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`, true),
    // Attempt 2: CodeTabs (Raw)
    () => tryFetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`),
    // Attempt 3: CORSProxy.io (Raw)
    () => tryFetch(`https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`),
    // Attempt 4: ThingProxy (Backup)
    () => tryFetch(`https://thingproxy.freeboard.io/fetch/${encodeURIComponent(cleanUrl)}`),
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      htmlContent = await attempt();
      if (htmlContent && htmlContent.length > 500) { 
        break;
      }
    } catch (e) {
      console.warn('Proxy attempt failed:', e);
      lastError = e;
      continue;
    }
  }

  if (!htmlContent || htmlContent.length < 200) {
    throw new Error('Falha de conexão. Não foi possível acessar a página. Tente novamente em alguns segundos.');
  }

  // Check for login walls
  if (htmlContent.includes('name="password"') || htmlContent.includes('sys_login')) {
    // Even if locked, sometimes metadata is present, so we continue but warn implicitly
    console.warn('Possible login wall detected');
  }

  // 3. Extraction Pipeline

  const commonData = {
    url: cleanUrl,
    name: getMeta(htmlContent, 'og:title') || 'Pinterest Board',
    thumbnail: getMeta(htmlContent, 'og:image')
  };

  // --- STRATEGY A: App Links (Deep Linking) ---
  // Extremely reliable when present (Mobile/App view)
  const appLinkMatch = htmlContent.match(/pinterest:\/\/board\/(\d+)/i);
  if (appLinkMatch && isValidId(appLinkMatch[1])) {
     return { ...commonData, id: appLinkMatch[1] };
  }

  // --- STRATEGY B: JSON-LD (Schema.org) ---
  // Look for structured data scripts
  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(htmlContent)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Check if it's a CollectionPage or similar and has mainEntity.identifier
      if (data['@type'] === 'CollectionPage' && data.mainEntity && data.mainEntity.identifier) {
        if (isValidId(data.mainEntity.identifier)) {
          return { ...commonData, id: data.mainEntity.identifier };
        }
      }
      // Direct identifier check
      if (data.identifier && isValidId(data.identifier)) {
        return { ...commonData, id: data.identifier };
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // --- STRATEGY C: PWS_DATA / Hydration JSON Deep Search ---
  // Instead of regexing the string for "board_id", we parse the JSON and traverse it.
  // This handles nested structures where the ID might be under 'redux', 'props', 'resources', etc.
  try {
    const pwsMatch = htmlContent.match(/<script[^>]*id="__PWS_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (pwsMatch && pwsMatch[1]) {
      const jsonData = JSON.parse(pwsMatch[1]);
      
      // 1. Direct BoardResource check (Most common in recent builds)
      const boardId = findKeyInObject(jsonData, 'board_id');
      if (isValidId(boardId)) {
        return { ...commonData, id: boardId! };
      }

      // 2. Entity ID check (Fallback in redux state)
      // Note: "entity_id" can sometimes be the user ID. We need to be careful.
      // Usually, inside BoardPage, the entity_id is the board.
      const entityId = findKeyInObject(jsonData, 'entity_id');
      if (isValidId(entityId)) {
        return { ...commonData, id: entityId! };
      }
    }
  } catch (e) {
    console.debug('Deep JSON search failed', e);
  }

  // --- STRATEGY D: Regex Scavenging (Fallbacks) ---
  
  // 1. "board_id": "123"
  const regexes = [
    /"board_id":\s*["']?(\d+)["']?/i,
    /"board":\s*\{\s*[^{}]*"id":\s*["']?(\d+)["']?/i, // Nested board: { id: ... }
    /data-board-id=["'](\d+)["']/i, // HTML attribute
    /"element_id":\s*["']?(\d+)["']?/i,
    /"objectId":\s*["']?(\d+)["']?/i, // Sometims used in resource responses
  ];

  for (const regex of regexes) {
    const rMatch = htmlContent.match(regex);
    if (rMatch && isValidId(rMatch[1])) {
      return { ...commonData, id: rMatch[1] };
    }
  }

  // --- STRATEGY E: Loose "Broad" Search (Last Resort) ---
  // Look for a large number near "type": "board" or "category": "board"
  // This is risky but helps when the page structure is minified/obfuscated
  const looseRegex = /"(?:type|category)":\s*"board".{1,400}?"id":\s*["']?(\d{10,25})["']?/is;
  const looseMatch = htmlContent.match(looseRegex);
  if (looseMatch && isValidId(looseMatch[1])) {
    return { ...commonData, id: looseMatch[1] };
  }

  throw new Error('Não foi possível localizar o Board ID. A pasta pode ser privada, removida ou a estrutura da página mudou.');
};