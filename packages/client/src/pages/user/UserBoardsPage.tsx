import { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Grid3X3, ArrowUpDown, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 6;
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import * as boardService from '@/services/pixelboard.service';
import { getApiError } from '@/services/api.utils';
import { PixelBoardStatus, type IPixelBoard } from '@/types';
import { STATUS_LABEL, getUserPixelCount } from '@/utils/pixelboard.utils';
import { createBoardSchema, type CreateBoardFormData } from './user.schema';

function BoardCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

function CreateBoardDialog({ onCreated }: { onCreated: (board: IPixelBoard) => void }) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<CreateBoardFormData>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      name: '',
      width: 50,
      height: 50,
      delay_seconds: 0,
      allow_override: false,
    },
  });

  const onSubmit = async (data: CreateBoardFormData) => {
    try {
      const board = await boardService.create(data);
      toast.success('PixelBoard créé avec succès !');
      onCreated(board);
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          Créer un board
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau PixelBoard</DialogTitle>
          <DialogDescription>
            Configurez votre nouveau board collaboratif.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du board</Label>
            <Input id="name" placeholder="Mon PixelBoard" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Largeur (px)</Label>
              <Input id="width" type="number" placeholder="50" {...register('width', { valueAsNumber: true })} />
              {errors.width && <p className="text-sm text-destructive">{errors.width.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Hauteur (px)</Label>
              <Input id="height" type="number" placeholder="50" {...register('height', { valueAsNumber: true })} />
              {errors.height && <p className="text-sm text-destructive">{errors.height.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delay_seconds">Délai entre pixels (secondes)</Label>
            <Input id="delay_seconds" type="number" placeholder="0" {...register('delay_seconds', { valueAsNumber: true })} />
            {errors.delay_seconds && <p className="text-sm text-destructive">{errors.delay_seconds.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Création…' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserBoardsPage() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<IPixelBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(boards.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => boards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [boards, currentPage],
  );

  useEffect(() => {
    boardService
      .getAll()
      .then((all) => {
        const mine = user
          ? all.filter((b) => b.contributions.some((c) => c.userId === user.id))
          : [];
        setBoards(mine);
      })
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, [user]);

  const totalPixels = boards.reduce(
    (sum, board) => sum + (user ? getUserPixelCount(board, user.id) : 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mes PixelBoards</h2>
        <p className="text-muted-foreground">
          Retrouvez tous les boards auxquels vous avez contribué.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total contributions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{boards.length} boards</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pixels placés</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalPixels}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              <div className="text-2xl font-bold">
                {boards.filter((b) => b.status === PixelBoardStatus.IN_PROGRESS).length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tous les boards</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ArrowUpDown className="mr-2 size-4" />
            Trier
          </Button>
          <CreateBoardDialog onCreated={(board) => setBoards((prev) => [board, ...prev])} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <BoardCardSkeleton key={i} />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Grid3X3 className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucun board disponible</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre premier PixelBoard pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((board) => {
            const myPixels = user ? getUserPixelCount(board, user.id) : 0;
            const totalBoardPixels = board.contributions.reduce(
              (sum, c) => sum + c.nb_pixels_placed,
              0,
            );
            const percentage =
              totalBoardPixels > 0 ? Math.round((myPixels / totalBoardPixels) * 100) : 0;

            return (
              <NavLink key={board.id} to={`/boards/${board.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{board.name}</CardTitle>
                      <Badge
                        variant={board.status === PixelBoardStatus.IN_PROGRESS ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {STATUS_LABEL[board.status]}
                      </Badge>
                    </div>
                    <CardDescription>{board.width} x {board.height} pixels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mes pixels</span>
                      <span className="font-medium">{myPixels}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ma contribution</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contributeurs</span>
                      <span className="font-medium">{board.contributions.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </NavLink>
            );
          })}
        </div>
      )}

      {!loading && boards.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {boards.length} board{boards.length > 1 ? 's' : ''} —
            page {currentPage} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserBoardsPage;
