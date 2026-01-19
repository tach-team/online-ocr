# Иконки расширения

Для работы расширения необходимы PNG иконки размером 16x16, 48x48 и 128x128 пикселей.

## Создание иконок

Вы можете создать иконки из предоставленного SVG файла (`icon.svg`) используя один из следующих способов:

1. **Онлайн конвертер**: Используйте [CloudConvert](https://cloudconvert.com/svg-to-png) или аналогичный сервис для конвертации SVG в PNG нужных размеров.

2. **ImageMagick** (если установлен):
   ```bash
   convert icon.svg -resize 16x16 icon16.png
   convert icon.svg -resize 48x48 icon48.png
   convert icon.svg -resize 128x128 icon128.png
   ```

3. **Inkscape** (если установлен):
   ```bash
   inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16
   inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48
   inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128
   ```

4. **Вручную**: Откройте `icon.svg` в любом графическом редакторе и экспортируйте в PNG нужных размеров.

После создания поместите файлы `icon16.png`, `icon48.png` и `icon128.png` в эту папку.
