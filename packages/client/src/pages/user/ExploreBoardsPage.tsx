import { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Grid3X3, Search, ChevronLeft, ChevronRight, Users, Paintbrush, CalendarDays, Map } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as boardService from '@/services/pixelboard.service';
import * as pixelService from '@/services/pixel.service';
import { getApiError } from '@/services/api.utils';
import { useGlobalMapSocket } from '@/hooks/use-global-map-socket';
import { PixelBoardStatus, type IPixelBoard, type IPixel } from '@/types';
import { STATUS_LABEL } from '@/utils/pixelboard.utils';
import { GlobalMapCanvas } from '@/components/map/GlobalMapCanvas';

const PAGE_SIZE = 9;

type StatusFilter = 'all' | PixelBoardStatus;
type SortKey = 'recent' | 'contributors' | 'pixels';

const SORT_OPTIONS: { label: string; value: SortKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Récent', value: 'recent', icon: CalendarDays },
  { label: 'Contributeurs', value: 'contributors', icon: Users },
  { label: 'Pixels placés', value: 'pixels', icon: Paintbrush },
];

function sortBoards(boards: IPixelBoard[], sort: SortKey): IPixelBoard[] {
  return [...boards].sort((a, b) => {
    if (sort === 'contributors') return b.contributions.length - a.contributions.length;
    if (sort === 'pixels') {
      const px = (board: IPixelBoard) => board.contributions.reduce((s, c) => s + c.nb_pixels_placed, 0);
      return px(b) - px(a);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function BoardCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

function MapTab({ boards, loading }: { boards: IPixelBoard[]; loading: boolean }) {
  const [pixelsByBoard, setPixelsByBoard] = useState<Record<string, IPixel[]>>({});

  useEffect(() => {
    if (boards.length === 0) return;
    boards.forEach((board) => {
      pixelService
        .getByBoard(board.id)
        .then((pixels) => setPixelsByBoard((prev) => ({ ...prev, [board.id]: pixels })))
        .catch(() => {});
    });
  }, [boards]);

  const boardIds = useMemo(() => boards.map((b) => b.id), [boards]);

  useGlobalMapSocket(boardIds, (event) => {
    setPixelsByBoard((prev) => {
      const existing = prev[event.boardId] ?? [];
      const idx = existing.findIndex(
        (p) => p.position_x === event.position_x && p.position_y === event.position_y,
      );
      const updated = [...existing];
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], color: event.color };
      } else {
        updated.push({
          id: `${event.boardId}-${event.position_x}-${event.position_y}`,
          pixelBoardId: event.boardId,
          userId: event.userId,
          username: event.username,
          position_x: event.position_x,
          position_y: event.position_y,
          color: event.color,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      return { ...prev, [event.boardId]: updated };
    });
  });

  if (loading) return <Skeleton className="w-full h-[500px] rounded-lg" />;

  if (boards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Grid3X3 className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun board disponible pour le moment.</p>
        </CardContent>
      </Card>
    );
  }

  return <GlobalMapCanvas boards={boards} pixelsByBoard={pixelsByBoard} />;
}

function ExploreBoardsPage() {
  const [boards, setBoards] = useState<IPixelBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);

  useEffect(() => {
    boardService
      .getAll()
      .then(setBoards)
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const result = boards.filter((b) => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
    return sortBoards(result, sort);
  }, [boards, search, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
    { label: 'Tous', value: 'all' },
    { label: STATUS_LABEL[PixelBoardStatus.IN_PROGRESS], value: PixelBoardStatus.IN_PROGRESS },
    { label: STATUS_LABEL[PixelBoardStatus.FINISHED], value: PixelBoardStatus.FINISHED },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Explorer les PixelBoards</h2>
        <p className="text-muted-foreground">
          Tous les boards disponibles — rejoignez et contribuez.
        </p>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <Grid3X3 className="size-4 mr-2" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="size-4 mr-2" />
            Carte globale
          </TabsTrigger>
        </TabsList>

        {/* Liste */}
        <TabsContent value="list" className="space-y-6 mt-4">
          {/* Barre de recherche */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher un board..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="pl-9"
            />
          </div>

          {/* Filtres + Tri */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground self-center">Statut :</span>
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setStatusFilter(f.value); resetPage(); }}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground self-center">Trier par :</span>
              {SORT_OPTIONS.map((s) => (
                <Button
                  key={s.value}
                  variant={sort === s.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setSort(s.value); resetPage(); }}
                >
                  <s.icon className="size-3.5 mr-1.5" />
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Résultats */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <BoardCardSkeleton key={i} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Grid3X3 className="size-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aucun board trouvé</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {filtered.length === 0 && boards.length > 0
                    ? 'Aucun board ne correspond à vos filtres.'
                    : "Aucun PixelBoard n'a encore été créé."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((board) => {
                const totalPixels = board.contributions.reduce(
                  (sum, c) => sum + c.nb_pixels_placed,
                  0,
                );

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
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="size-3.5" /> Contributeurs
                          </span>
                          <span className="font-medium">{board.contributions.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Paintbrush className="size-3.5" /> Pixels placés
                          </span>
                          <span className="font-medium">{totalPixels}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="size-3.5" /> Créé le
                          </span>
                          <span className="font-medium">
                            {new Date(board.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </NavLink>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filtered.length} board{filtered.length > 1 ? 's' : ''} —
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
        </TabsContent>

        {/* Carte globale — chargée uniquement à l'ouverture de l'onglet */}
        <TabsContent value="map" className="mt-4">
          <MapTab boards={boards} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ExploreBoardsPage;
