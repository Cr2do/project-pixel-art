import { Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PixelLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  iconClassName?: string;
}

const sizeConfig = {
  sm: {
    icon: 'size-5',
    wrapper: 'size-7',
    title: 'text-sm font-bold',
    sub: 'text-[10px]',
  },
  md: {
    icon: 'size-5',
    wrapper: 'size-9',
    title: 'text-base font-bold',
    sub: 'text-xs',
  },
  lg: {
    icon: 'size-6',
    wrapper: 'size-11',
    title: 'text-lg font-bold',
    sub: 'text-xs',
  },
  xl: {
    icon: 'size-8',
    wrapper: 'size-16',
    title: 'text-2xl font-bold',
    sub: 'text-sm',
  },
};

export function PixelLogo({
  size = 'md',
  showText = true,
  className,
  iconClassName,
}: PixelLogoProps) {
  const cfg = sizeConfig[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground',
          cfg.wrapper,
          iconClassName,
        )}
      >
        <Grid3X3 className={cfg.icon} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('tracking-tight text-foreground', cfg.title)}>
            PixelBoard
          </span>
          <span className={cn('text-muted-foreground', cfg.sub)}>
            Collaborative Art
          </span>
        </div>
      )}
    </div>
  );
}
