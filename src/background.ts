chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    // Проверяем, что страница доступна для инжекции скриптов
    const url = tab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://')) {
      console.error('Cannot inject content script on this page:', url);
      return;
    }

    // Открываем side panel
    await chrome.sidePanel.open({ tabId: tab.id });

    // Функция для активации overlay
    const activateOverlay = async () => {
      try {
        await chrome.tabs.sendMessage(tab.id!, {
          type: 'ACTIVATE_OVERLAY',
        });
      } catch (sendError) {
        // Если content script не загружен, инжектируем его программно
        if (chrome.runtime.lastError?.message?.includes('Receiving end does not exist')) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id! },
              files: ['content.js'],
            });

            // Ждем инициализации content script
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Пытаемся снова отправить сообщение
            await chrome.tabs.sendMessage(tab.id!, {
              type: 'ACTIVATE_OVERLAY',
            });
          } catch (injectError) {
            console.error('Failed to inject content script:', injectError);
            throw injectError;
          }
        } else {
          throw sendError;
        }
      }
    };

    await activateOverlay();
  } catch (error) {
    console.error('Error activating extension:', error);
  }
});

// Обработка сообщений от content script и side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_AREA') {
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
