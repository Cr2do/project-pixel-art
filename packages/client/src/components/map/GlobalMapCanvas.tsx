import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CANVAS_GRID_COLOR,
  CANVAS_GRID_MIN_CELL_SIZE,
  CANVAS_EMPTY_COLOR,
  CANVAS_MIN_CELL_SIZE,
  CANVAS_MAX_CELL_SIZE,
  CANVAS_DEFAULT_CELL_SIZE,
  CANVAS_ZOOM_FACTOR,
} from '@/utils/canvas.utils';
import type { IPixelBoard, IPixel } from '@/types';

const BOARD_BORDER_ACTIVE = '#3b82f6';
const BOARD_BORDER_FINISHED = '#94a3b8';
const BOARD_LABEL_BG = 'rgba(0,0,0,0.6)';
const MIN_CELL_SIZE = CANVAS_MIN_CELL_SIZE;
const MAX_CELL_SIZE = CANVAS_MAX_CELL_SIZE;
const DEFAULT_CELL_SIZE = CANVAS_DEFAULT_CELL_SIZE;
const ZOOM_FACTOR = CANVAS_ZOOM_FACTOR;

const zoomInStep = (cs: number) => Math.min(MAX_CELL_SIZE, Math.max(cs + 1, Math.round(cs * ZOOM_FACTOR)));
const zoomOutStep = (cs: number) => Math.max(MIN_CELL_SIZE, Math.min(cs - 1, Math.round(cs / ZOOM_FACTOR)));

interface Props {
  boards: IPixelBoard[];
  pixelsByBoard: Record<string, IPixel[]>;
}

export function GlobalMapCanvas({ boards, pixelsByBoard }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellSizeRef = useRef(DEFAULT_CELL_SIZE);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pixelsByBoardRef = useRef(pixelsByBoard);

  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    pixelsByBoardRef.current = pixelsByBoard;
  }, [pixelsByBoard]);

  const globalWidth = boards.reduce((max, b) => Math.max(max, b.position_x + b.width), 0);
  const globalHeight = boards.reduce((max, b) => Math.max(max, b.position_y + b.height), 0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = cellSizeRef.current;
    const { x: ox, y: oy } = offsetRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const board of boards) {
      const bx = board.position_x * cs + ox;
      const by = board.position_y * cs + oy;
      const bw = board.width * cs;
      const bh = board.height * cs;

      ctx.fillStyle = CANVAS_EMPTY_COLOR;
      ctx.fillRect(bx, by, bw, bh);

      const pixels = pixelsByBoardRef.current[board.id] ?? [];
      for (const px of pixels) {
        ctx.fillStyle = px.color;
        ctx.fillRect(bx + px.position_x * cs, by + px.position_y * cs, cs, cs);
      }

      if (cs >= CANVAS_GRID_MIN_CELL_SIZE) {
        ctx.strokeStyle = CANVAS_GRID_COLOR;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= board.width; x++) {
          ctx.beginPath();
          ctx.moveTo(bx + x * cs, by);
          ctx.lineTo(bx + x * cs, by + bh);
          ctx.stroke();
        }
        for (let y = 0; y <= board.height; y++) {
          ctx.beginPath();
          ctx.moveTo(bx, by + y * cs);
          ctx.lineTo(bx + bw, by + y * cs);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = board.status === 'IN_PROGRESS' ? BOARD_BORDER_ACTIVE : BOARD_BORDER_FINISHED;
      ctx.lineWidth = Math.max(1, cs * 0.1);
      ctx.strokeRect(bx, by, bw, bh);

      const label = board.name;
      const fontSize = Math.min(14, Math.max(8, cs * 2));
      ctx.font = `${fontSize}px sans-serif`;
      const textW = ctx.measureText(label).width;
      const lx = bx + 4;
      const ly = by + 4;
      ctx.fillStyle = BOARD_LABEL_BG;
      ctx.fillRect(lx - 4, ly - 2, textW + 8, fontSize + 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, lx, ly + fontSize - 2);
    }
  }, [boards]);

  useEffect(() => {
    draw();
  }, [draw, pixelsByBoard]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    if (globalWidth === 0 || globalHeight === 0) {
      draw();
      return;
    }

    const fitted = Math.max(MIN_CELL_SIZE, Math.floor(
      Math.min(width / globalWidth, height / globalHeight) * 0.9,
    ));
    const cs = Math.min(MAX_CELL_SIZE, fitted);
    cellSizeRef.current = cs;
    setCellSize(cs);
    offsetRef.current = {
      x: (width - globalWidth * cs) / 2,
      y: (height - globalHeight * cs) / 2,
    };
    draw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cellSizeRef.current = cellSize;
    draw();
  }, [cellSize, draw]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      draw();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prevCs = cellSizeRef.current;
      const newCs = e.deltaY < 0 ? zoomInStep(prevCs) : zoomOutStep(prevCs);
      if (newCs === prevCs) return;
      offsetRef.current = {
        x: mx - (mx - offsetRef.current.x) * (newCs / prevCs),
        y: my - (my - offsetRef.current.y) * (newCs / prevCs),
      };
      cellSizeRef.current = newCs;
      setCellSize(newCs);
      draw();
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [draw]);

  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      offsetRef.current = {
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      };
      draw();
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
  }, [draw]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanningRef.current = true;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
  }, []);

  const handleZoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const prevCs = cellSizeRef.current;
    const newCs = zoomInStep(prevCs);
    if (newCs === prevCs) return;
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newCs / prevCs),
      y: cy - (cy - offsetRef.current.y) * (newCs / prevCs),
    };
    cellSizeRef.current = newCs;
    setCellSize(newCs);
    draw();
  };

  const handleZoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const prevCs = cellSizeRef.current;
    const newCs = zoomOutStep(prevCs);
    if (newCs === prevCs) return;
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newCs / prevCs),
      y: cy - (cy - offsetRef.current.y) * (newCs / prevCs),
    };
    cellSizeRef.current = newCs;
    setCellSize(newCs);
    draw();
  };

  const handleFit = () => {
    const canvas = canvasRef.current;
    if (!canvas || globalWidth === 0) return;
    const fitted = Math.max(MIN_CELL_SIZE, Math.floor(
      Math.min(canvas.width / globalWidth, canvas.height / globalHeight) * 0.9,
    ));
    const newCs = Math.min(MAX_CELL_SIZE, fitted);
    offsetRef.current = {
      x: (canvas.width - globalWidth * newCs) / 2,
      y: (canvas.height - globalHeight * newCs) / 2,
    };
    cellSizeRef.current = newCs;
    setCellSize(newCs);
    draw();
  };

  return (
    <div className="space-y-3">
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
        <Button variant="outline" size="icon" onClick={handleFit} title="Vue globale">
          <Maximize2 className="size-4" />
        </Button>
        <span className="text-xs text-muted-foreground ml-2">
          Molette pour zoomer · Cliquer-glisser pour se déplacer
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-lg border overflow-hidden"
        style={{ height: '500px' }}
      >
        <canvas
          ref={canvasRef}
          className={isPanning ? 'cursor-grabbing' : 'cursor-grab'}
          style={{ position: 'absolute', top: 0, left: 0 }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
}
