// Типы для выделения и viewport

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportInfo {
  scrollX: number;
  scrollY: number;
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
}
