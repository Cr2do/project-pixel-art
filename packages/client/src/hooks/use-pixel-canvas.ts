import { useState, useRef, useCallback, useEffect } from 'react';
import { PIXEL_PALETTE } from '@/utils/canvas.utils';
import type { IHoveredCell } from '@/types';

export interface PixelCanvasActions {
  pixels: string[][];
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  cooldownRemaining: number;
  hoveredCell: IHoveredCell | null;
  setHoveredCell: (cell: IHoveredCell | null) => void;
  placePixel: (x: number, y: number) => void;
}

export function usePixelCanvas(
  width: number,
  height: number,
  delaySeconds: number,
  allowOverride: boolean,
): PixelCanvasActions {
  const [pixels, setPixels] = useState<string[][]>(() =>
    Array.from({ length: height }, () => Array(width).fill('')),
  );
  const [selectedColor, setSelectedColor] = useState<string>(PIXEL_PALETTE[3]);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<IHoveredCell | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
