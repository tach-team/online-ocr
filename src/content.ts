import { SelectionManager } from './utils/selection';

let selectionManager: SelectionManager | null = null;

// Инициализация при загрузке скрипта
function init() {
  if (!selectionManager) {
    selectionManager = new SelectionManager();
  }
}

// Обработка сообщений от background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ACTIVATE_OVERLAY') {
    try {
      if (!selectionManager) {
        init();
      }
      selectionManager?.activate();
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error activating overlay:', error);
      sendResponse({ success: false, error: String(error) });
    }
    return true; // Асинхронный ответ
  }
});

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
