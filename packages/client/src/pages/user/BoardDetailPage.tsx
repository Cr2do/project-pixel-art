import { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { ArrowLeft, Clock, Grid3X3, Users, Layers } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import * as boardService from '@/services/pixelboard.service';
import * as pixelService from '@/services/pixel.service';
import { getApiError } from '@/services/api.utils';
import { PixelBoardStatus, type IPixelBoard, type IPixel } from '@/types';
import { STATUS_LABEL, getUserPixelCount } from '@/utils/pixelboard.utils';
import { PixelCanvas } from '@/components/canvas/PixelCanvas';
import { useBoardSocket, type PixelPlacedEvent } from '@/hooks/use-board-socket';

interface ExternalPixel {
  x: number;
  y: number;
  color: string;
  username?: string;
}

function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [board, setBoard] = useState<IPixelBoard | null>(null);
  const [pixels, setPixels] = useState<IPixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [externalPixel, setExternalPixel] = useState<ExternalPixel | null>(null);

  useBoardSocket(id ?? '', (event: PixelPlacedEvent) => {
    setExternalPixel({ x: event.position_x, y: event.position_y, color: event.color, username: event.username });
  });

  useEffect(() => {
    if (!id) return;

    Promise.all([boardService.getById(id), pixelService.getByBoard(id)])
      .then(([b, px]) => {
        setBoard(b);
        setPixels(px);
      })
      .catch((err) => {
        const msg = getApiError(err);
        if (msg.toLowerCase().includes('introuvable') || msg.includes('404')) {
          setNotFound(true);
        } else {
          toast.error(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePixelPlace = async (x: number, y: number, color: string) => {
    if (!id) return;
    try {
      const newPixel = await pixelService.placePixel(id, {
        position_x: x,
        position_y: y,
        color,
      });
      setPixels((prev) => {
        const exists = prev.findIndex(
          (p) => p.position_x === x && p.position_y === y,
        );
        if (exists !== -1) {
          const next = [...prev];
          next[exists] = newPixel;
          return next;
        }
        return [...prev, newPixel];
      });
      toast.success('Pixel placé !');
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (notFound || !board) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Grid3X3 className="size-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Board introuvable</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Ce PixelBoard n'existe pas ou a été supprimé.
        </p>
        <Button variant="outline" asChild>
          <NavLink to="/my-boards">
            <ArrowLeft className="mr-2 size-4" />
            Retour aux boards
          </NavLink>
        </Button>
      </div>
    );
  }

  const isActive = board.status === PixelBoardStatus.IN_PROGRESS;
  const myPixels = user ? getUserPixelCount(board, user.id) : 0;
  const totalPixels = board.contributions.reduce((sum, c) => sum + c.nb_pixels_placed, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="size-8">
              <NavLink to="/my-boards">
                <ArrowLeft className="size-4" />
              </NavLink>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">{board.name}</h2>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {STATUS_LABEL[board.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Créé le {new Date(board.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taille</CardTitle>
            <Grid3X3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{board.width} x {board.height}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Délai</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{board.delay_seconds}s</div>
            <p className="text-xs text-muted-foreground">Entre chaque pixel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mode</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {board.allow_override ? 'Superposition' : 'Unique'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contributeurs</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{board.contributions.length}</div>
            <p className="text-xs text-muted-foreground">{totalPixels} pixels au total</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <PixelCanvas
            board={board}
            pixels={pixels}
            isActive={isActive}
            onPixelPlace={handlePixelPlace}
            externalPixel={externalPixel}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ma contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pixels placés</p>
              <p className="text-2xl font-bold">{myPixels}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Part du total</p>
              <p className="text-2xl font-bold">
                {totalPixels > 0 ? Math.round((myPixels / totalPixels) * 100) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BoardDetailPage;
