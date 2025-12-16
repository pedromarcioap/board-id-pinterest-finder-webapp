// content.js - Executa no contexto da página do Pinterest

(() => {
  /**
   * UTILITÁRIOS
   */
  const log = (msg, data = '') => console.log(`[BoardID Finder] ${msg}`, data);

  // Valida formato numérico de ID
  const isValidId = (id) => {
    return id && /^\d{5,}$/.test(String(id));
  };

  // Busca recursiva em objetos JSON
  const deepSearchKey = (obj, keyToFind) => {
    if (!obj || typeof obj !== 'object') return null;
    if (obj[keyToFind]) return obj[keyToFind];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const res = deepSearchKey(obj[key], keyToFind);
        if (res) return res;
      }
    }
    return null;
  };

  /**
   * PIPELINE DE EXTRAÇÃO
   */

  // ESTRATÉGIA 1: App Links (Metadata Mobile)
  // Geralmente: <meta property="al:ios:url" content="pinterest://board/123456" />
  const strategyAppLinks = () => {
    try {
      const meta = document.querySelector('meta[property="al:ios:url"]') || 
                   document.querySelector('meta[property="al:android:url"]');
      if (meta) {
        const content = meta.getAttribute('content');
        const match = content.match(/board\/(\d+)/);
        if (match && isValidId(match[1])) return match[1];
      }
    } catch (e) { console.debug('Strategy 1 fail', e); }
    return null;
  };

  // ESTRATÉGIA 2: JSON-LD (Schema.org)
  const strategyJsonLd = () => {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        const json = JSON.parse(script.innerText);
        // Verifica CollectionPage
        if (json['@type'] === 'CollectionPage' && json.mainEntity?.identifier) {
          if (isValidId(json.mainEntity.identifier)) return json.mainEntity.identifier;
        }
        // Verifica genérico
        if (json.identifier && isValidId(json.identifier)) return json.identifier;
      }
    } catch (e) { console.debug('Strategy 2 fail', e); }
    return null;
  };

  // ESTRATÉGIA 3: Hydration Scripts (__PWS_DATA__)
  // O Pinterest guarda o estado da aplicação aqui.
  const strategyPwsData = () => {
    try {
      const script = document.getElementById('__PWS_DATA__');
      if (script) {
        const json = JSON.parse(script.innerText);
        
        // Tentativa direta: props.initialReduxState.resources.BoardResource
        const boardId = deepSearchKey(json, 'board_id');
        if (isValidId(boardId)) return boardId;

        // Tentativa fallback: entity_id (pode ser user id as vezes, cuidado)
        // Geralmente seguro se estiver dentro de um contexto de Board
        if (json.props?.current_url?.includes('/')) {
           const entityId = deepSearchKey(json, 'entity_id');
           if (isValidId(entityId)) return entityId;
        }
      }
    } catch (e) { console.debug('Strategy 3 fail', e); }
    return null;
  };

  // ESTRATÉGIA 4: React Fiber Traversal (A "Nuclear Option")
  // Acessa as props internas dos elementos DOM montados pelo React
  const strategyReactFiber = () => {
    try {
      // Encontra a chave interna do React no elemento root ou body
      const findReactKey = (node) => Object.keys(node).find(key => key.startsWith('__reactProps$'));
      
      const targets = [
        document.querySelector('[data-test-id="board-header"]'),
        document.querySelector('[data-test-id="board-title"]'),
        document.querySelector('#__PWS_ROOT__')?.firstChild,
        document.body
      ];

      for (const target of targets) {
        if (!target) continue;
        const key = findReactKey(target);
        if (key) {
          const props = target[key];
          // Procura board_id nas props desse componente e filhos
          const foundId = deepSearchKey(props, 'board_id');
          if (isValidId(foundId)) return foundId;
        }
      }
    } catch (e) { console.debug('Strategy 4 fail', e); }
    return null;
  };

  /**
   * MAIN EXECUTOR
   */
  const executePipeline = () => {
    log('Iniciando pipeline de extração...');

    // Executa em ordem de confiabilidade/velocidade
    const s1 = strategyAppLinks();
    if (s1) return { id: s1, method: 'DeepLink', success: true };

    const s2 = strategyJsonLd();
    if (s2) return { id: s2, method: 'JSON-LD', success: true };

    const s3 = strategyPwsData();
    if (s3) return { id: s3, method: 'PWS_DATA', success: true };
    
    const s4 = strategyReactFiber();
    if (s4) return { id: s4, method: 'ReactFiber', success: true };

    // Metadados básicos para UI caso falhe
    const url = window.location.href;
    const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
    const image = document.querySelector('meta[property="og:image"]')?.content;

    return { 
      success: false, 
      error: 'Não foi possível encontrar o ID. Certifique-se de estar na página principal de um Board.',
      meta: { url, title, image }
    };
  };

  // Listener para mensagens do Popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_BOARD_ID') {
      const result = executePipeline();
      
      // Adiciona metadados da página ao resultado de sucesso
      if (result.success) {
        result.meta = {
          url: window.location.href,
          title: document.querySelector('meta[property="og:title"]')?.content || document.title,
          image: document.querySelector('meta[property="og:image"]')?.content
        };
      }
      
      sendResponse(result);
    }
    return true;
  });

})();