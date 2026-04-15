import { useEffect, useState, useCallback } from 'react';
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

  const handlePixelPlaced = useCallback((event: PixelPlacedEvent) => {
    setExternalPixel({ x: event.position_x, y: event.position_y, color: event.color, username: event.username });
  }, []);

  useBoardSocket(id ?? '', handlePixelPlaced);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [maxPixels, setMaxPixels] = useState(50000);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayEvents, setReplayEvents] = useState<boardService.ReplayEvent[]>([]);
  const [replayTotal, setReplayTotal] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeedMs, setReplaySpeedMs] = useState(250);

  useEffect(() => {
    if (!replayPlaying || replayEvents.length === 0) return;

    if (replayIndex >= replayEvents.length - 1) {
      setReplayPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setReplayIndex((prev) => Math.min(prev + 1, replayEvents.length - 1));
    }, replaySpeedMs);

    return () => window.clearTimeout(timer);
  }, [replayPlaying, replayIndex, replayEvents, replaySpeedMs]);

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

  const handleImageUpload = async () => {
    if (!id) return;
    if (!uploadFile) {
      toast.error('Sélectionnez un fichier PNG');
      return;
    }

    setUploading(true);
    try {
      const summary = await boardService.uploadImageContribution(id, {
        image: uploadFile,
        offset_x: offsetX,
        offset_y: offsetY,
        maxPixels,
      });

      const [b, px] = await Promise.all([boardService.getById(id), pixelService.getByBoard(id)]);
      setBoard(b);
      setPixels(px);

      toast.success(
        `Import terminé: ${summary.appliedPixels} appliqué(s), ${summary.skippedPixels} ignoré(s).`,
      );
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleLoadReplay = async () => {
    if (!id) return;
    setReplayLoading(true);
    try {
      const replay = await boardService.getReplay(id, 200, 0);
      setReplayEvents(replay.events);
      setReplayTotal(replay.totalEvents);
      setReplayIndex(0);
      setReplayPlaying(false);
      toast.success('Replay chargé');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setReplayLoading(false);
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
  const replayCurrent = replayEvents.length > 0 ? replayEvents[Math.min(replayIndex, replayEvents.length - 1)] : null;

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
          <p className="text-sm text-muted-foreground ml-10">
            Fin: {board.endAt ? new Date(board.endAt).toLocaleString('fr-FR') : 'Non définie'}
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

      <Card>
        <CardHeader>
          <CardTitle>Outils avancés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a href={boardService.getExportUrl(board.id, 'png')} target="_blank" rel="noreferrer">
                Export PNG
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={boardService.getExportUrl(board.id, 'svg')} target="_blank" rel="noreferrer">
                Export SVG
              </a>
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Uploader une image PNG</h4>
            <div className="grid gap-3 md:grid-cols-4">
              <input
                type="file"
                accept="image/png"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setUploadFile(file);
                }}
                className="md:col-span-2"
              />
              <input
                type="number"
                value={offsetX}
                onChange={(event) => setOffsetX(Number(event.target.value) || 0)}
                placeholder="offset_x"
                className="rounded-md border bg-background px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={offsetY}
                onChange={(event) => setOffsetY(Number(event.target.value) || 0)}
                placeholder="offset_y"
                className="rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                value={maxPixels}
                onChange={(event) => setMaxPixels(Number(event.target.value) || 50000)}
                placeholder="maxPixels"
                className="w-40 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <Button disabled={uploading} onClick={() => void handleImageUpload()}>
                {uploading ? 'Import…' : 'Importer sur le board'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-medium">Replay des contributions</h4>
              <Button variant="outline" disabled={replayLoading} onClick={() => void handleLoadReplay()}>
                {replayLoading ? 'Chargement…' : 'Charger replay'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Événements chargés: {replayEvents.length} / {replayTotal}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={replayEvents.length === 0}
                onClick={() => setReplayIndex(0)}
              >
                Reset
              </Button>
              <Button
                size="sm"
                disabled={replayEvents.length === 0}
                onClick={() => setReplayPlaying((prev) => !prev)}
              >
                {replayPlaying ? 'Pause' : 'Play'}
              </Button>
              <label className="text-xs text-muted-foreground">
                Vitesse
              </label>
              <select
                className="rounded-md border bg-background px-2 py-1 text-xs"
                value={replaySpeedMs}
                onChange={(event) => setReplaySpeedMs(Number(event.target.value))}
              >
                <option value={100}>x4</option>
                <option value={250}>x2</option>
                <option value={500}>x1</option>
                <option value={1000}>x0.5</option>
              </select>
              <input
                type="range"
                min={0}
                max={Math.max(0, replayEvents.length - 1)}
                value={Math.min(replayIndex, Math.max(0, replayEvents.length - 1))}
                onChange={(event) => {
                  setReplayPlaying(false);
                  setReplayIndex(Number(event.target.value));
                }}
                className="w-40"
                disabled={replayEvents.length === 0}
              />
              <span className="text-xs text-muted-foreground">
                {replayEvents.length === 0 ? 0 : replayIndex + 1}/{replayEvents.length}
              </span>
            </div>
            {replayCurrent && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs">
                <p>Pixel courant: ({replayCurrent.position_x},{replayCurrent.position_y})</p>
                <p>Couleur: {replayCurrent.color}</p>
                <p>Date: {new Date(replayCurrent.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            )}
            <div className="max-h-64 overflow-auto rounded-md border">
              {replayEvents.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Aucun événement chargé.</p>
              ) : (
                <div className="divide-y">
                  {replayEvents.map((event, idx) => (
                    <div
                      key={event.pixelId}
                      className={`flex items-center justify-between gap-3 p-2 text-xs ${idx <= replayIndex ? 'bg-primary/5' : ''}`}
                    >
                      <span>({event.position_x},{event.position_y})</span>
                      <span>{event.color}</span>
                      <span>{new Date(event.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BoardDetailPage;
