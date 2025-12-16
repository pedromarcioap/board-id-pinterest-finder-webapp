// popup.js - Controle da Interface

document.addEventListener('DOMContentLoaded', async () => {
  // Elementos DOM
  const views = {
    loading: document.getElementById('status-area'),
    result: document.getElementById('result-view'),
    error: document.getElementById('error-view')
  };

  const elements = {
    statusText: document.getElementById('status-text'),
    boardName: document.getElementById('board-name'),
    boardThumb: document.getElementById('board-thumb'),
    boardId: document.getElementById('board-id-display'),
    method: document.getElementById('detection-method'),
    copyBtn: document.getElementById('copy-btn'),
    errorMsg: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn')
  };

  // Funções de UI
  const showView = (viewName) => {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
  };

  const showError = (msg) => {
    elements.errorMsg.textContent = msg;
    showView('error');
  };

  // Lógica Principal
  const runExtraction = async () => {
    showView('loading');
    elements.statusText.textContent = "Conectando ao Pinterest...";

    // 1. Obter aba ativa
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('pinterest.com')) {
      showError('Por favor, abra uma pasta do Pinterest para usar a ferramenta.');
      return;
    }

    // 2. Enviar mensagem para o Content Script
    elements.statusText.textContent = "Analisando estrutura da página...";
    
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_BOARD_ID' });

      if (response && response.success) {
        // Renderizar Sucesso
        elements.boardId.textContent = response.id;
        elements.method.textContent = response.method;
        elements.boardName.textContent = response.meta.title || 'Pinterest Board';
        
        if (response.meta.image) {
          elements.boardThumb.src = response.meta.image;
          elements.boardThumb.classList.remove('hidden');
        } else {
          elements.boardThumb.classList.add('hidden');
        }

        showView('result');
      } else {
        // Erro retornado pelo script
        showError(response.error || 'Não foi possível encontrar o ID.');
      }
    } catch (err) {
      console.error(err);
      // Se falhar a comunicação, geralmente é porque o content script não carregou
      // ou a página precisa de refresh
      showError('Erro de conexão. Tente recarregar a página do Pinterest.');
      
      // Tentar injetar o script programaticamente se não existir (fallback)
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).catch(() => {});
    }
  };

  // Copiar para área de transferência
  elements.copyBtn.addEventListener('click', () => {
    const id = elements.boardId.textContent;
    navigator.clipboard.writeText(id).then(() => {
      const originalText = elements.copyBtn.innerHTML;
      elements.copyBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Copiado!
      `;
      elements.copyBtn.classList.add('copied');
      
      setTimeout(() => {
        elements.copyBtn.innerHTML = originalText;
        elements.copyBtn.classList.remove('copied');
      }, 2000);
    });
  });

  elements.retryBtn.addEventListener('click', runExtraction);

  // Iniciar automaticamente
  runExtraction();
});