import { useRef, useEffect, useCallback, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, User } from 'lucide-react';
import { usePixelCanvas } from '@/hooks/use-pixel-canvas';
import {
  PIXEL_PALETTE,
  CANVAS_GRID_COLOR,
  CANVAS_HOVER_COLOR,
  CANVAS_EMPTY_COLOR,
  CANVAS_GRID_MIN_CELL_SIZE,
  getCellFromMouseEvent,
} from '@/utils/canvas.utils';
import { Button } from '@/components/ui/button';
import type { IPixelBoard, IPixel } from '@/types';

const MIN_CELL_SIZE = 2;
const MAX_CELL_SIZE = 40;
const DEFAULT_CELL_SIZE = 10;
const ZOOM_FACTOR = 1.2;

interface ExternalPixel {
  x: number;
  y: number;
  color: string;
  username?: string;
}

interface PixelCanvasProps {
  board: IPixelBoard;
  pixels: IPixel[];
  isActive: boolean;
  onPixelPlace: (x: number, y: number, color: string) => Promise<void>;
  externalPixel?: ExternalPixel | null;
}

export function PixelCanvas({ board, pixels: initialPixels, isActive, onPixelPlace, externalPixel }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellSizeRef = useRef(DEFAULT_CELL_SIZE);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);

  const {
    pixels,
    authors,
    selectedColor,
    setSelectedColor,
    cooldownRemaining,
    hoveredCell,
    setHoveredCell,
    placePixel,
    applyExternalPixel,
  } = usePixelCanvas(board.width, board.height, board.delay_seconds, board.allow_override, initialPixels, onPixelPlace);

  useEffect(() => {
    if (!externalPixel) return;
    applyExternalPixel(externalPixel.x, externalPixel.y, externalPixel.color, externalPixel.username);
  }, [externalPixel, applyExternalPixel]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = cellSizeRef.current;

    canvas.width = cs * board.width;
    canvas.height = cs * board.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        ctx.fillStyle = pixels[y][x] || CANVAS_EMPTY_COLOR;
        ctx.fillRect(x * cs, y * cs, cs, cs);
      }
    }

    if (cs >= CANVAS_GRID_MIN_CELL_SIZE) {
      ctx.strokeStyle = CANVAS_GRID_COLOR;
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= board.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cs, 0);
        ctx.lineTo(x * cs, board.height * cs);
        ctx.stroke();
      }
      for (let y = 0; y <= board.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cs);
        ctx.lineTo(board.width * cs, y * cs);
        ctx.stroke();
      }
    }

    if (hoveredCell && isActive && cooldownRemaining === 0) {
      ctx.fillStyle = CANVAS_HOVER_COLOR;
      ctx.fillRect(hoveredCell.x * cs, hoveredCell.y * cs, cs, cs);
    }
  }, [pixels, hoveredCell, board.width, board.height, isActive, cooldownRemaining]);

  // Keep ref in sync and redraw when cellSize changes
  useEffect(() => {
    cellSizeRef.current = cellSize;
    drawCanvas();
  }, [cellSize, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Zoom with mouse wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCellSize((prev) => {
        const next = e.deltaY < 0
          ? Math.round(prev * ZOOM_FACTOR)
          : Math.round(prev / ZOOM_FACTOR);
        return Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, next));
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  const handleZoomIn = () =>
    setCellSize((prev) => Math.min(MAX_CELL_SIZE, Math.round(prev * ZOOM_FACTOR)));

  const handleZoomOut = () =>
    setCellSize((prev) => Math.max(MIN_CELL_SIZE, Math.round(prev / ZOOM_FACTOR)));

  const handleFit = () => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const fitted = Math.max(
      MIN_CELL_SIZE,
      Math.floor(Math.min(width / board.width, height / board.height)),
    );
    setCellSize(fitted);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isActive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cell = getCellFromMouseEvent(e.clientX, e.clientY, canvas, cellSizeRef.current);
      if (cell.x >= 0 && cell.x < board.width && cell.y >= 0 && cell.y < board.height) {
        setHoveredCell(cell);
      } else {
        setHoveredCell(null);
      }
    },
    [isActive, board.width, board.height, setHoveredCell],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, [setHoveredCell]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isActive || cooldownRemaining > 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cell = getCellFromMouseEvent(e.clientX, e.clientY, canvas, cellSizeRef.current);
      if (cell.x >= 0 && cell.x < board.width && cell.y >= 0 && cell.y < board.height) {
        placePixel(cell.x, cell.y);
      }
    },
    [isActive, cooldownRemaining, board.width, board.height, placePixel],
  );

  return (
    <div className="space-y-4">
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomOut} title="Dézoomer">
          <ZoomOut className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground w-16 text-center tabular-nums">
          {cellSize}px/cel
        </span>
        <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoomer">
          <ZoomIn className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleFit} title="Adapter à la fenêtre">
          <Maximize2 className="size-4" />
        </Button>
        <span className="text-xs text-muted-foreground ml-2">
          Molette pour zoomer · {board.width} × {board.height} pixels
        </span>
      </div>

      {/* Canvas container — height adapts to board, capped at 85vh */}
      <div
        ref={containerRef}
        className="relative w-full overflow-auto rounded-lg border bg-muted/30"
        style={{
          height: Math.min(cellSize * board.height, window.innerHeight * 0.85),
          minHeight: 200,
        }}
      >
        {/* Inner wrapper centers the canvas when smaller than the container */}
        <div className="flex items-center justify-center min-w-full min-h-full">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className={isActive ? 'cursor-crosshair' : 'cursor-default'}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            />
            {hoveredCell && isActive && (
              <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white pointer-events-none space-y-0.5">
                <div>x: {hoveredCell.x}, y: {hoveredCell.y}</div>
                {authors[hoveredCell.y]?.[hoveredCell.x] && (
                  <div className="flex items-center gap-1 text-white/80">
                    <User className="size-3" />
                    {authors[hoveredCell.y][hoveredCell.x]}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isActive && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-1.5">
            {PIXEL_PALETTE.map((color) => (
              <button
                key={color}
                title={color}
                onClick={() => setSelectedColor(color)}
                className="size-7 rounded transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  outline:
                    selectedColor === color
                      ? '2px solid hsl(var(--primary))'
                      : '2px solid transparent',
                  outlineOffset: '2px',
                  border: '1px solid rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 text-sm">
            {cooldownRemaining > 0 ? (
              <>
                <span className="size-2 rounded-full bg-orange-400 animate-pulse inline-block" />
                <span className="text-muted-foreground">
                  Prochain pixel dans{' '}
                  <span className="font-semibold text-foreground">{cooldownRemaining}s</span>
                </span>
              </>
            ) : (
              <>
                <span className="size-2 rounded-full bg-green-500 inline-block" />
                <span className="text-green-600 font-medium">Prêt à dessiner</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
