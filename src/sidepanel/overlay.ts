// Управление selection overlay

import { elements } from './dom-elements';

// Функция для активации overlay
export function activateOverlay(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ACTIVATE_OVERLAY',
      }).catch(() => {
        // Игнорируем ошибки, если content script не загружен
      });
    }
  });
}

// Функция для деактивации overlay
export function deactivateOverlay(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'DEACTIVATE_OVERLAY',
        }).catch(() => {
          // Игнорируем ошибки, если content script не загружен
        });
      }
    });
  });
}

// Функция для деактивации overlay из toggle (аналогична deactivateOverlay)
export function deactivateOverlayFromToggle(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'DEACTIVATE_OVERLAY',
        }).catch(() => {
          // Игнорируем ошибки, если content script не загружен
        });
      }
    });
  });
}

// Обработчик переключения свитчера
export function handleToggleChange(): void {
  if (elements.screenshotToggle.checked) {
    activateOverlay();
  } else {
    deactivateOverlayFromToggle();
  }
}

// Запрос новой области выделения
export function requestNewSelection(): void {
  // Отправляем сообщение content script для активации overlay
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ACTIVATE_OVERLAY',
      });
      // Включаем свитчер при запросе новой области
      if (elements.screenshotToggle) {
        elements.screenshotToggle.checked = true;
      }
    }
  });
}
