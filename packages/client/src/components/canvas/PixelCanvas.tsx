import { useRef, useEffect, useCallback } from 'react';
import { usePixelCanvas } from '@/hooks/use-pixel-canvas';
import {
  PIXEL_PALETTE,
  CANVAS_GRID_COLOR,
  CANVAS_HOVER_COLOR,
  CANVAS_EMPTY_COLOR,
  CANVAS_GRID_MIN_CELL_SIZE,
  getCellFromMouseEvent,
} from '@/utils/canvas.utils';
import type { IPixelBoard } from '@/types';

interface PixelCanvasProps {
  board: IPixelBoard;
  isActive: boolean;
}

export function PixelCanvas({ board, isActive }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellSizeRef = useRef(8);

  const {
    pixels,
    selectedColor,
    setSelectedColor,
    cooldownRemaining,
    hoveredCell,
    setHoveredCell,
    placePixel,
  } = usePixelCanvas(board.width, board.height, board.delay_seconds, board.allow_override);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = cellSizeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        ctx.fillStyle = pixels[y][x] || CANVAS_EMPTY_COLOR;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    if (cellSize >= CANVAS_GRID_MIN_CELL_SIZE) {
      ctx.strokeStyle = CANVAS_GRID_COLOR;
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= board.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, board.height * cellSize);
        ctx.stroke();
      }
      for (let y = 0; y <= board.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(board.width * cellSize, y * cellSize);
        ctx.stroke();
      }
    }

    if (hoveredCell && isActive && cooldownRemaining === 0) {
      ctx.fillStyle = CANVAS_HOVER_COLOR;
      ctx.fillRect(
        hoveredCell.x * cellSize,
        hoveredCell.y * cellSize,
        cellSize,
        cellSize,
      );
    }
  }, [pixels, hoveredCell, board.width, board.height, isActive, cooldownRemaining]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { width: containerWidth, height: containerHeight } =
        container.getBoundingClientRect();
      const cellSize = Math.max(
        1,
        Math.floor(Math.min(containerWidth / board.width, containerHeight / board.height)),
      );
      cellSizeRef.current = cellSize;
      canvas.width = cellSize * board.width;
      canvas.height = cellSize * board.height;
      drawCanvas();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [board.width, board.height, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

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
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full overflow-hidden rounded-lg border bg-muted/30"
        style={{ minHeight: '400px', maxHeight: '70vh' }}
      >
        <canvas
          ref={canvasRef}
          className={isActive ? 'cursor-crosshair' : 'cursor-default'}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        {hoveredCell && isActive && (
          <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white pointer-events-none">
            x: {hoveredCell.x}, y: {hoveredCell.y}
          </div>
        )}
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
