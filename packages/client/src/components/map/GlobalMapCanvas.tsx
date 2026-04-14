import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapBoard, GlobalMapResponse } from '@/services/map.service';

const EMPTY_COLOR = '#F8F9FA';
const BOARD_BORDER_ACTIVE = '#3b82f6';
const BOARD_BORDER_FINISHED = '#94a3b8';
const BOARD_LABEL_BG = 'rgba(0,0,0,0.6)';
const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const ZOOM_FACTOR = 1.25;
const LABEL_MIN_SCALE = 1.5;

interface Props {
  data: GlobalMapResponse;
}

interface HoveredBoard {
  board: MapBoard;
  screenX: number;
  screenY: number;
}

export function GlobalMapCanvas({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const didPanRef = useRef(false);

  const [scale, setScale] = useState(1);
  const [hoveredBoard, setHoveredBoard] = useState<HoveredBoard | null>(null);
  const navigate = useNavigate();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: ox, y: oy } = offsetRef.current;
    const s = scaleRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const board of data.boards) {
      const bx = board.position_x * s + ox;
      const by = board.position_y * s + oy;
      const bw = board.width * s;
      const bh = board.height * s;

      // Board background
      ctx.fillStyle = EMPTY_COLOR;
      ctx.fillRect(bx, by, bw, bh);

      // Pixels
      for (const px of board.pixels) {
        ctx.fillStyle = px.color;
        ctx.fillRect(bx + px.x * s, by + px.y * s, Math.max(1, s), Math.max(1, s));
      }

      // Board border
      ctx.strokeStyle = board.status === 'IN_PROGRESS' ? BOARD_BORDER_ACTIVE : BOARD_BORDER_FINISHED;
      ctx.lineWidth = Math.max(1, s * 0.5);
      ctx.strokeRect(bx, by, bw, bh);

      // Board label (only when zoomed enough)
      if (s >= LABEL_MIN_SCALE) {
        const label = board.name;
        const fontSize = Math.min(14, Math.max(8, s * 2));
        ctx.font = `${fontSize}px sans-serif`;
        const textW = ctx.measureText(label).width;
        const padX = 4;
        const padY = 2;
        const lx = bx + 4;
        const ly = by + 4;
        ctx.fillStyle = BOARD_LABEL_BG;
        ctx.fillRect(lx - padX, ly - padY, textW + padX * 2, fontSize + padY * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, lx, ly + fontSize - 2);
      }
    }
  }, [data]);

  // Fit all boards in view on mount
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    if (data.globalWidth === 0 || data.globalHeight === 0) {
      draw();
      return;
    }

    const s = Math.min(width / data.globalWidth, height / data.globalHeight) * 0.9;
    const ox = (width - data.globalWidth * s) / 2;
    const oy = (height - data.globalHeight * s) / 2;

    scaleRef.current = s;
    offsetRef.current = { x: ox, y: oy };
    setScale(s);
    draw();
  }, [data, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Resize canvas on window resize
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

  // Mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * factor));

      offsetRef.current = {
        x: mx - (mx - offsetRef.current.x) * (newScale / scaleRef.current),
        y: my - (my - offsetRef.current.y) * (newScale / scaleRef.current),
      };
      scaleRef.current = newScale;
      setScale(newScale);
      draw();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [draw]);

  // Pan — global listeners so dragging works even when cursor leaves the canvas
  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      offsetRef.current = {
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      };
      didPanRef.current = true;
      draw();
      setHoveredBoard(null);
    };

    const onWindowMouseUp = () => {
      isPanningRef.current = false;
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
    didPanRef.current = false;
    panStartRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
  }, []);

  // Hover detection only (panning is handled globally above)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s = scaleRef.current;
    const { x: ox, y: oy } = offsetRef.current;
    const worldX = (mx - ox) / s;
    const worldY = (my - oy) / s;

    const found = data.boards.find(
      (b) =>
        worldX >= b.position_x &&
        worldX <= b.position_x + b.width &&
        worldY >= b.position_y &&
        worldY <= b.position_y + b.height,
    );

    setHoveredBoard(found ? { board: found, screenX: e.clientX, screenY: e.clientY } : null);
  }, [data]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didPanRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s = scaleRef.current;
    const { x: ox, y: oy } = offsetRef.current;
    const worldX = (mx - ox) / s;
    const worldY = (my - oy) / s;

    const found = data.boards.find(
      (b) =>
        worldX >= b.position_x &&
        worldX <= b.position_x + b.width &&
        worldY >= b.position_y &&
        worldY <= b.position_y + b.height,
    );

    if (found) navigate(`/boards/${found.id}`);
  }, [data, navigate]);

  const handleZoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const newScale = Math.min(MAX_SCALE, scaleRef.current * ZOOM_FACTOR);
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newScale / scaleRef.current),
      y: cy - (cy - offsetRef.current.y) * (newScale / scaleRef.current),
    };
    scaleRef.current = newScale;
    setScale(newScale);
    draw();
  };

  const handleZoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const newScale = Math.max(MIN_SCALE, scaleRef.current / ZOOM_FACTOR);
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newScale / scaleRef.current),
      y: cy - (cy - offsetRef.current.y) * (newScale / scaleRef.current),
    };
    scaleRef.current = newScale;
    setScale(newScale);
    draw();
  };

  const handleFit = () => {
    const canvas = canvasRef.current;
    if (!canvas || data.globalWidth === 0) return;
    const s = Math.min(canvas.width / data.globalWidth, canvas.height / data.globalHeight) * 0.9;
    offsetRef.current = {
      x: (canvas.width - data.globalWidth * s) / 2,
      y: (canvas.height - data.globalHeight * s) / 2,
    };
    scaleRef.current = s;
    setScale(s);
    draw();
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomOut} title="Dézoomer">
          <ZoomOut className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground w-16 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoomer">
          <ZoomIn className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleFit} title="Vue globale">
          <Maximize2 className="size-4" />
        </Button>
        <span className="text-xs text-muted-foreground ml-2">
          Molette pour zoomer · Cliquer-glisser pour se déplacer · Cliquer sur un board pour l'ouvrir
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg border overflow-hidden"
        style={{ height: '500px' }}
      >
        <canvas
          ref={canvasRef}
          className={hoveredBoard ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { if (!isPanningRef.current) setHoveredBoard(null); }}
          onClick={handleClick}
        />

        {/* Hover tooltip */}
        {hoveredBoard && (
          <div
            className="fixed z-50 rounded bg-black/80 px-3 py-1.5 text-xs text-white pointer-events-none"
            style={{ left: hoveredBoard.screenX + 12, top: hoveredBoard.screenY - 10 }}
          >
            <span className="font-medium">{hoveredBoard.board.name}</span>
            <span className="ml-2 text-white/60">
              {hoveredBoard.board.width}×{hoveredBoard.board.height}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
