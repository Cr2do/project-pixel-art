import { useRef, useEffect, useCallback, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, User } from 'lucide-react';
import { usePixelCanvas } from '@/hooks/use-pixel-canvas';
import {
  PIXEL_PALETTE,
  CANVAS_GRID_COLOR,
  CANVAS_HOVER_COLOR,
  CANVAS_EMPTY_COLOR,
  CANVAS_GRID_MIN_CELL_SIZE,
  CANVAS_MIN_CELL_SIZE,
  CANVAS_MAX_CELL_SIZE,
  CANVAS_DEFAULT_CELL_SIZE,
  CANVAS_ZOOM_FACTOR,
} from '@/utils/canvas.utils';
import { Button } from '@/components/ui/button';
import type { IPixelBoard, IPixel } from '@/types';

const MIN_CELL_SIZE = CANVAS_MIN_CELL_SIZE;
const MAX_CELL_SIZE = CANVAS_MAX_CELL_SIZE;
const DEFAULT_CELL_SIZE = CANVAS_DEFAULT_CELL_SIZE;
const ZOOM_FACTOR = CANVAS_ZOOM_FACTOR;

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
  const offsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const didPanRef = useRef(false);

  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [isPanning, setIsPanning] = useState(false);

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
    const { x: ox, y: oy } = offsetRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background behind and around the board
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Board pixels
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        ctx.fillStyle = pixels[y][x] || CANVAS_EMPTY_COLOR;
        ctx.fillRect(x * cs + ox, y * cs + oy, cs, cs);
      }
    }

    // Grid (only when cells are large enough)
    if (cs >= CANVAS_GRID_MIN_CELL_SIZE) {
      ctx.strokeStyle = CANVAS_GRID_COLOR;
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= board.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cs + ox, oy);
        ctx.lineTo(x * cs + ox, board.height * cs + oy);
        ctx.stroke();
      }
      for (let y = 0; y <= board.height; y++) {
        ctx.beginPath();
        ctx.moveTo(ox, y * cs + oy);
        ctx.lineTo(board.width * cs + ox, y * cs + oy);
        ctx.stroke();
      }
    }

    // Hover highlight
    if (hoveredCell && isActive && cooldownRemaining === 0) {
      ctx.fillStyle = CANVAS_HOVER_COLOR;
      ctx.fillRect(hoveredCell.x * cs + ox, hoveredCell.y * cs + oy, cs, cs);
    }
  }, [pixels, hoveredCell, board.width, board.height, isActive, cooldownRemaining]);

  // Init canvas size and center board on mount
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    const cs = cellSizeRef.current;
    offsetRef.current = {
      x: (width - board.width * cs) / 2,
      y: (height - board.height * cs) / 2,
    };
    drawCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw on pixel / hover changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Keep ref in sync with state, redraw
  useEffect(() => {
    cellSizeRef.current = cellSize;
    drawCanvas();
  }, [cellSize, drawCanvas]);

  // Resize canvas when container changes
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      drawCanvas();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [drawCanvas]);

  // Zoom with mouse wheel, centered on cursor position
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prevCs = cellSizeRef.current;
      const rawNext = e.deltaY < 0 ? Math.round(prevCs * ZOOM_FACTOR) : Math.round(prevCs / ZOOM_FACTOR);
      const newCs = Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, rawNext));
      if (newCs === prevCs) return;
      offsetRef.current = {
        x: mx - (mx - offsetRef.current.x) * (newCs / prevCs),
        y: my - (my - offsetRef.current.y) * (newCs / prevCs),
      };
      cellSizeRef.current = newCs;
      setCellSize(newCs);
      drawCanvas();
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [drawCanvas]);

  // Pan — global listeners so dragging works even when cursor leaves the canvas
  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      offsetRef.current = {
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      };
      didPanRef.current = true;
      setHoveredCell(null);
      drawCanvas();
    };
    const onWindowMouseUp = () => {
      isPanningRef.current = false;
      setIsPanning(false);
    };
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [drawCanvas, setHoveredCell]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    isPanningRef.current = true;
    didPanRef.current = false;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isActive || isPanningRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cs = cellSizeRef.current;
      const { x: ox, y: oy } = offsetRef.current;
      const cellX = Math.floor((mx - ox) / cs);
      const cellY = Math.floor((my - oy) / cs);
      if (cellX >= 0 && cellX < board.width && cellY >= 0 && cellY < board.height) {
        setHoveredCell({ x: cellX, y: cellY });
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
      if (!isActive || cooldownRemaining > 0 || didPanRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cs = cellSizeRef.current;
      const { x: ox, y: oy } = offsetRef.current;
      const cellX = Math.floor((mx - ox) / cs);
      const cellY = Math.floor((my - oy) / cs);
      if (cellX >= 0 && cellX < board.width && cellY >= 0 && cellY < board.height) {
        placePixel(cellX, cellY);
      }
    },
    [isActive, cooldownRemaining, board.width, board.height, placePixel],
  );

  const handleZoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const prevCs = cellSizeRef.current;
    const newCs = Math.min(MAX_CELL_SIZE, Math.round(prevCs * ZOOM_FACTOR));
    if (newCs === prevCs) return;
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newCs / prevCs),
      y: cy - (cy - offsetRef.current.y) * (newCs / prevCs),
    };
    cellSizeRef.current = newCs;
    setCellSize(newCs);
    drawCanvas();
  };

  const handleZoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const prevCs = cellSizeRef.current;
    const newCs = Math.max(MIN_CELL_SIZE, Math.round(prevCs / ZOOM_FACTOR));
    if (newCs === prevCs) return;
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newCs / prevCs),
      y: cy - (cy - offsetRef.current.y) * (newCs / prevCs),
    };
    cellSizeRef.current = newCs;
    setCellSize(newCs);
    drawCanvas();
  };

  const handleFit = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const { width, height } = container.getBoundingClientRect();
    const fitted = Math.floor(Math.min(width / board.width, height / board.height));
    const newCs = Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, fitted));
    offsetRef.current = {
      x: (width - board.width * newCs) / 2,
      y: (height - board.height * newCs) / 2,
    };
    cellSizeRef.current = newCs;
    setCellSize(newCs);
    drawCanvas();
  };

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
          Molette pour zoomer · Cliquer-glisser pour se déplacer · {board.width} × {board.height} pixels
        </span>
      </div>

      {/* Canvas container — fixed height, pan handled inside canvas */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg border overflow-hidden"
        style={{
          height: Math.min(window.innerHeight * 0.85, 700),
          minHeight: 300,
        }}
      >
        <canvas
          ref={canvasRef}
          className={isPanning ? 'cursor-grabbing' : isActive ? 'cursor-crosshair' : 'cursor-grab'}
          style={{ position: 'absolute', top: 0, left: 0 }}
          onMouseDown={handleMouseDown}
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
