export const PIXEL_PALETTE: string[] = [
  '#FFFFFF',
  '#E4E4E4',
  '#888888',
  '#222222',
  '#FFA7D1',
  '#E50000',
  '#E59500',
  '#A06A42',
  '#E5D900',
  '#94E044',
  '#02BE01',
  '#00D3DD',
  '#0083C7',
  '#0000EA',
  '#CF6EE4',
  '#820080',
];

export const CANVAS_GRID_COLOR = 'rgba(0,0,0,0.08)';
export const CANVAS_HOVER_COLOR = 'rgba(255,255,255,0.35)';
export const CANVAS_EMPTY_COLOR = '#F8F9FA';
export const CANVAS_GRID_MIN_CELL_SIZE = 4;

export const CANVAS_MIN_CELL_SIZE = 2;
export const CANVAS_MAX_CELL_SIZE = 40;
export const CANVAS_DEFAULT_CELL_SIZE = 20;
export const CANVAS_ZOOM_FACTOR = 1.2;

export function getCellFromMouseEvent(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  cellSize: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((clientX - rect.left) / cellSize),
    y: Math.floor((clientY - rect.top) / cellSize),
  };
}
