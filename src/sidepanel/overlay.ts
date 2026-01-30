// Управление selection overlay

import { elements } from './dom-elements';
import { MESSAGE_TYPES } from '../constants';

// Функция для активации overlay
export function activateOverlay(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: MESSAGE_TYPES.ACTIVATE_OVERLAY,
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
          type: MESSAGE_TYPES.DEACTIVATE_OVERLAY,
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
    deactivateOverlay();
  }
}

// Запрос новой области выделения
export function requestNewSelection(): void {
  // Отправляем сообщение content script для активации overlay
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: MESSAGE_TYPES.ACTIVATE_OVERLAY,
      });
      // Включаем свитчер при запросе новой области
      if (elements.screenshotToggle) {
        elements.screenshotToggle.checked = true;
      }
    }
  });
}
