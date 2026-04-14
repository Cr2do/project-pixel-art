import { useState, useRef, useCallback, useEffect } from 'react';
import { PIXEL_PALETTE } from '@/utils/canvas.utils';
import type { IHoveredCell, IPixel } from '@/types';

export interface PixelCanvasActions {
  pixels: string[][];
  authors: string[][];
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  cooldownRemaining: number;
  hoveredCell: IHoveredCell | null;
  setHoveredCell: (cell: IHoveredCell | null) => void;
  placePixel: (x: number, y: number) => void;
  applyExternalPixel: (x: number, y: number, color: string, username?: string) => void;
}

function buildGrids(width: number, height: number, initialPixels: IPixel[]): { pixels: string[][]; authors: string[][] } {
  const pixels = Array.from({ length: height }, () => Array<string>(width).fill(''));
  const authors = Array.from({ length: height }, () => Array<string>(width).fill(''));
  for (const p of initialPixels) {
    if (p.position_y < height && p.position_x < width) {
      pixels[p.position_y][p.position_x] = p.color;
      authors[p.position_y][p.position_x] = p.username ?? '';
    }
  }
  return { pixels, authors };
}

export function usePixelCanvas(
  width: number,
  height: number,
  delaySeconds: number,
  allowOverride: boolean,
  initialPixels: IPixel[],
  onPlace: (x: number, y: number, color: string) => Promise<void>,
): PixelCanvasActions {
  const [pixels, setPixels] = useState<string[][]>(() => buildGrids(width, height, initialPixels).pixels);
  const [authors, setAuthors] = useState<string[][]>(() => buildGrids(width, height, initialPixels).authors);
  const [selectedColor, setSelectedColor] = useState<string>(PIXEL_PALETTE[3]);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<IHoveredCell | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const placePixel = useCallback(
    (x: number, y: number) => {
      if (cooldownRemaining > 0) return;
      if (!allowOverride && pixels[y][x] !== '') return;

      setPixels((prev) => {
        const next = prev.map((row) => [...row]);
        next[y][x] = selectedColor;
        return next;
      });

      if (intervalRef.current) clearInterval(intervalRef.current);
      setCooldownRemaining(delaySeconds);

      intervalRef.current = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      onPlaceRef.current(x, y, selectedColor);
    },
    [cooldownRemaining, allowOverride, pixels, selectedColor, delaySeconds],
  );

  const applyExternalPixel = useCallback((x: number, y: number, color: string, username?: string) => {
    setPixels((prev) => {
      const next = prev.map((row) => [...row]);
      next[y][x] = color;
      return next;
    });
    setAuthors((prev) => {
      const next = prev.map((row) => [...row]);
      next[y][x] = username ?? '';
      return next;
    });
  }, []);

  return {
    pixels,
    authors,
    selectedColor,
    setSelectedColor,
    cooldownRemaining,
    hoveredCell,
    setHoveredCell,
    placePixel,
    applyExternalPixel,
  };
}
