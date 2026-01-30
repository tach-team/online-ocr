// Константы инлайнены, т.к. service worker не поддерживает ES модули
const MESSAGE_TYPES = {
  PING: 'PING',
  CAPTURE_AREA: 'CAPTURE_AREA',
} as const;

const RESTRICTED_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://'];
const CONTENT_SCRIPT = 'content.js';
const CONTEXT_MENU_ID = 'online-ocr-convert';

// Общая функция активации расширения (открытие sidepanel + инжекция content script)
async function activateExtension(tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id) return;

  try {
    // Проверяем, что страница доступна для инжекции скриптов
    const url = tab.url || '';
    if (RESTRICTED_URL_PREFIXES.some(prefix => url.startsWith(prefix))) {
      console.error('Cannot inject content script on this page:', url);
      return;
    }

    // Открываем side panel
    await chrome.sidePanel.open({ tabId: tab.id });

    // Убеждаемся, что content script загружен
    try {
      await chrome.tabs.sendMessage(tab.id!, {
        type: MESSAGE_TYPES.PING,
      });
    } catch (sendError) {
      // Если content script не загружен, инжектируем его программно
      if (chrome.runtime.lastError?.message?.includes('Receiving end does not exist')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            files: [CONTENT_SCRIPT],
          });
        } catch (injectError) {
          console.error('Failed to inject content script:', injectError);
        }
      }
    }
  } catch (error) {
    console.error('Error activating extension:', error);
  }
}

// Создаём контекстное меню при установке/обновлении расширения
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Convert picture to text',
    contexts: ['page', 'image', 'frame'],
  });
});

// Обработчик клика по контекстному меню
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab) return;
  await activateExtension(tab);
});

// Обработчик клика по иконке расширения
chrome.action.onClicked.addListener(async (tab) => {
  await activateExtension(tab);
});

// Обработка сообщений от content script и side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.CAPTURE_AREA) {
    // Получаем windowId или используем текущее окно
    const windowId = sender.tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
    
    // Получаем скриншот видимой области вкладки
    chrome.tabs.captureVisibleTab(
      windowId,
      { format: 'png' },
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ 
          imageData: dataUrl, 
          selection: message.selection,
          viewport: message.viewport,
        });
      }
    );
    return true; // Асинхронный ответ
  }
});
