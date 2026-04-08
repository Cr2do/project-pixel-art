import { useParams, NavLink } from 'react-router-dom';
import { ArrowLeft, Clock, Grid3X3, Users, Layers } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MOCK_PIXELBOARDS } from '@/mocks/pixelboard.mock';
import { MOCK_CURRENT_USER } from '@/mocks/user.mock';
import { PixelBoardStatus } from '@/types';
import { STATUS_LABEL, getUserPixelCount } from '@/utils/pixelboard.utils';

function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const board = MOCK_PIXELBOARDS.find((b) => b._id === id);
  const user = MOCK_CURRENT_USER;

  if (!board) {
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
  const myPixels = getUserPixelCount(board, user._id);
  const totalPixels = board.contributions.reduce(
    (sum, c) => sum + c.nb_pixels_placed,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="size-8">
              <NavLink to="/my-boards">
                <ArrowLeft className="size-4" />
              </NavLink>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">{board.name}</h2>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
            >
              {STATUS_LABEL[board.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Créé le {new Date(board.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taille</CardTitle>
            <Grid3X3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {board.width} x {board.height}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Délai</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{board.delay_seconds}s</div>
            <p className="text-xs text-muted-foreground">
              Entre chaque pixel
            </p>
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
            <div className="text-2xl font-bold">
              {board.contributions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPixels} pixels au total
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Canvas placeholder + Ma contribution */}
      {/* Canvas - pleine largeur */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Canvas</CardTitle>
          {isActive && (
            <Button disabled>
              Dessiner (bientôt disponible)
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 w-full"
            style={{
              aspectRatio: `${board.width}/${board.height}`,
              minHeight: '400px',
              maxHeight: '70vh',
            }}
          >
            <div className="text-center text-muted-foreground">
              <Grid3X3 className="size-16 mx-auto mb-3" />
              <p className="text-lg font-medium">Canvas {board.width}x{board.height}</p>
              <p className="text-sm">Zone de dessin a venir</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ma contribution */}
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
                {totalPixels > 0
                  ? Math.round((myPixels / totalPixels) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BoardDetailPage;
