import { SelectionManager } from './utils/selection';

// Константы инлайнены, т.к. content scripts не поддерживают ES модули
const MESSAGE_TYPES = {
  PING: 'PING',
  ACTIVATE_OVERLAY: 'ACTIVATE_OVERLAY',
  DEACTIVATE_OVERLAY: 'DEACTIVATE_OVERLAY',
} as const;

let selectionManager: SelectionManager | null = null;

// Инициализация при загрузке скрипта
function init() {
  if (!selectionManager) {
    selectionManager = new SelectionManager();
  }
}

// Обработка сообщений от background script и sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.PING) {
    sendResponse({ success: true });
    return false;
  }

  if (message.type === MESSAGE_TYPES.ACTIVATE_OVERLAY) {
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

  if (message.type === MESSAGE_TYPES.DEACTIVATE_OVERLAY) {
    try {
      selectionManager?.deactivate();
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error deactivating overlay:', error);
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
