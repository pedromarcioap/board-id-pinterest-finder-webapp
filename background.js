// background.js - Gerencia eventos globais da extensão
// Manifest V3 exige Service Workers, que são efêmeros (não persistem memória).

chrome.runtime.onInstalled.addListener(() => {
  console.log('BoardID Pinterest Finder instalado com sucesso.');
});

// Listener placeholder para manter o SW ativo quando necessário
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Apenas repassa ou loga, a lógica pesada fica no content script
  return true;
});