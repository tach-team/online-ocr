export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SelectionManager {
  private overlay: HTMLDivElement | null = null;
  private selectionBox: HTMLDivElement | null = null;
  private isSelecting: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentSelection: SelectionRect | null = null;

  constructor() {
    this.createOverlay();
  }

  private createOverlay(): void {
    // Создаем overlay поверх страницы
    this.overlay = document.createElement('div');
    this.overlay.id = 'ocr-overlay';
    this.overlay.className = 'ocr-overlay';

    // Создаем рамку для выделения
    this.selectionBox = document.createElement('div');
    this.selectionBox.id = 'ocr-selection-box';
    this.selectionBox.className = 'ocr-selection-box';

    // Создаем инструкцию
    const instruction = document.createElement('div');
    instruction.id = 'ocr-instruction';
    instruction.className = 'ocr-instruction';
    instruction.textContent = 'Выделите область для извлечения текста';

    this.overlay.appendChild(instruction);
    this.overlay.appendChild(this.selectionBox);
    document.body.appendChild(this.overlay);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.overlay || !this.selectionBox) return;

    // Начало выделения
    this.overlay.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isSelecting = true;
      const rect = this.overlay!.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;

      this.selectionBox!.style.display = 'block';
      this.selectionBox!.style.left = `${this.startX}px`;
      this.selectionBox!.style.top = `${this.startY}px`;
      this.selectionBox!.style.width = '0px';
      this.selectionBox!.style.height = '0px';
    });

    // Перемещение мыши при выделении
    this.overlay.addEventListener('mousemove', (e) => {
      if (!this.isSelecting || !this.selectionBox) return;

      const rect = this.overlay!.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const width = Math.abs(currentX - this.startX);
      const height = Math.abs(currentY - this.startY);
      const left = Math.min(this.startX, currentX);
      const top = Math.min(this.startY, currentY);

      this.selectionBox.style.left = `${left}px`;
      this.selectionBox.style.top = `${top}px`;
      this.selectionBox.style.width = `${width}px`;
      this.selectionBox.style.height = `${height}px`;

      this.currentSelection = {
        x: left,
        y: top,
        width,
        height,
      };
    });

    // Завершение выделения
    this.overlay.addEventListener('mouseup', async () => {
      if (!this.isSelecting) return;
      this.isSelecting = false;

      if (this.currentSelection && this.currentSelection.width > 10 && this.currentSelection.height > 10) {
        await this.captureSelection();
      } else {
        // Если выделение слишком маленькое, скрываем рамку
        if (this.selectionBox) {
          this.selectionBox.style.display = 'none';
        }
      }
    });

    // Отмена выделения по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.deactivate();
      }
    });
  }

  private async captureSelection(): Promise<void> {
    if (!this.currentSelection) return;

    // Получаем информацию о viewport для правильного расчета координат
    const viewportInfo = {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    };

    // Отправляем запрос на скриншот
    chrome.runtime.sendMessage(
      {
        type: 'CAPTURE_AREA',
        selection: this.currentSelection,
        viewport: viewportInfo,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error capturing area:', chrome.runtime.lastError);
          return;
        }

        if (response.error) {
          console.error('Capture error:', response.error);
          return;
        }

        // Отправляем изображение в side panel
        chrome.runtime.sendMessage({
          type: 'PROCESS_IMAGE',
          imageData: response.imageData,
          selection: response.selection,
          viewport: response.viewport,
        });

        // Деактивируем overlay
        this.deactivate();
      }
    );
  }

  public activate(): void {
    if (this.overlay) {
      this.overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  public deactivate(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
    if (this.selectionBox) {
      this.selectionBox.style.display = 'none';
    }
    this.isSelecting = false;
    this.currentSelection = null;
  }

  public destroy(): void {
    this.deactivate();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
