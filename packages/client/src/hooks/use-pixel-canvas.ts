import { useState, useRef, useCallback, useEffect } from 'react';
import { PIXEL_PALETTE } from '@/utils/canvas.utils';
import type { IHoveredCell, IPixel } from '@/types';

export interface PixelCanvasActions {
  pixels: string[][];
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  cooldownRemaining: number;
  hoveredCell: IHoveredCell | null;
  setHoveredCell: (cell: IHoveredCell | null) => void;
  placePixel: (x: number, y: number) => void;
}

function buildGrid(width: number, height: number, initialPixels: IPixel[]): string[][] {
  const grid = Array.from({ length: height }, () => Array<string>(width).fill(''));
  for (const p of initialPixels) {
    if (p.position_y < height && p.position_x < width) {
      grid[p.position_y][p.position_x] = p.color;
    }
  }
  return grid;
}

export function usePixelCanvas(
  width: number,
  height: number,
  delaySeconds: number,
  allowOverride: boolean,
  initialPixels: IPixel[],
  onPlace: (x: number, y: number, color: string) => Promise<void>,
): PixelCanvasActions {
  const [pixels, setPixels] = useState<string[][]>(() =>
    buildGrid(width, height, initialPixels),
  );
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

  return {
    pixels,
    selectedColor,
    setSelectedColor,
    cooldownRemaining,
    hoveredCell,
    setHoveredCell,
    placePixel,
  };
}
