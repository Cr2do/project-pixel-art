import { useEffect, useMemo, useRef, useState } from 'react';

import { adminGetPixelBoardHeatmap, adminGetPixelBoards, type AdminBoardHeatmap } from '@/services/admin.service';
import type { IPixelBoard } from '@/types';

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function intensityToColor(t: number) {
  const alpha = 0.05 + 0.95 * clamp01(t);
  return `rgba(239,68,68,${alpha})`; // tailwind red-500
}

function AdminHeatmapPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [boards, setBoards] = useState<IPixelBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [heatmap, setHeatmap] = useState<AdminBoardHeatmap | null>(null);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingBoards(true);
        const data = await adminGetPixelBoards();
        if (cancelled) return;
        setBoards(data);
        // default to first board
        if (data.length > 0) setSelectedBoardId(data[0]?.id ?? '');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erreur lors du chargement des boards');
      } finally {
        if (!cancelled) setLoadingBoards(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedBoardId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingHeatmap(true);
        setError(null);
        const data = await adminGetPixelBoardHeatmap(selectedBoardId);
        if (cancelled) return;
        setHeatmap(data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erreur lors du chargement de la heatmap');
        setHeatmap(null);
      } finally {
        if (!cancelled) setLoadingHeatmap(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBoardId]);

  const pointsMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!heatmap) return map;
    for (const p of heatmap.points) {
      map.set(`${p.x},${p.y}`, p.count);
    }
    return map;
  }, [heatmap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !heatmap) return;

    const draw = () => {
      const { width, height } = heatmap.board;
      const maxCount = heatmap.maxCount || 1;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;
      canvas.width = Math.floor(containerWidth * dpr);
      canvas.height = Math.floor(containerHeight * dpr);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, containerWidth, containerHeight);
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      const cellSize = Math.max(1, Math.floor(Math.min(containerWidth / width, containerHeight / height)));
      const gridWidth = cellSize * width;
      const gridHeight = cellSize * height;
      const offsetX = Math.floor((containerWidth - gridWidth) / 2);
      const offsetY = Math.floor((containerHeight - gridHeight) / 2);

      for (const p of heatmap.points) {
        const t = p.count / maxCount;
        ctx.fillStyle = intensityToColor(t);
        ctx.fillRect(offsetX + p.x * cellSize, offsetY + p.y * cellSize, cellSize, cellSize);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      if (cellSize >= 6) {
      for (let x = 0; x <= width; x += 1) {
        const px = offsetX + x * cellSize;
        ctx.beginPath();
        ctx.moveTo(px + 0.5, offsetY);
        ctx.lineTo(px + 0.5, offsetY + gridHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 1) {
        const py = offsetY + y * cellSize;
        ctx.beginPath();
        ctx.moveTo(offsetX, py + 0.5);
        ctx.lineTo(offsetX + gridWidth, py + 0.5);
        ctx.stroke();
      }
      }
    };

    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [heatmap, pointsMap]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Heatmap des pixels les plus utilisés</h2>
        <p className="text-muted-foreground">
          Cette page affiche une heatmap basée sur le nombre de placements (y compris les overrides). Plus une case est
          rouge, plus elle a été modifiée.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">PixelBoard</label>
          <select
            className="h-10 min-w-65 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            disabled={loadingBoards}
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.width}×{b.height})
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-muted-foreground">
          {loadingBoards && 'Chargement des boards…'}
          {!loadingBoards && boards.length === 0 && 'Aucun board disponible.'}
        </div>
      </div>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <div className="rounded-lg border bg-card p-3">
          {loadingHeatmap && <div className="text-sm text-muted-foreground">Chargement de la heatmap…</div>}
          {!loadingHeatmap && heatmap && heatmap.points.length === 0 && (
            <div className="text-sm text-muted-foreground">Aucun placement enregistré pour ce board.</div>
          )}
          <div ref={containerRef} className="relative mt-2 h-105 w-full overflow-hidden rounded-md bg-muted/10">
            <canvas ref={canvasRef} className="block h-full w-full" />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-3">
          <div className="text-sm font-medium">Légende</div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.05), rgba(239,68,68,1))' }} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{heatmap?.maxCount ?? 0}</span>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max sur une case</span>
              <span>{heatmap?.maxCount ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cases touchées</span>
              <span>{heatmap?.points.length ?? '-'}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Astuce: si vous voulez une heatmap sur une période (jour/semaine), on peut facilement ajouter des filtres
            <code className="mx-1 rounded bg-muted px-1">from</code>/<code className="rounded bg-muted px-1">to</code>
            côté API.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHeatmapPage;

