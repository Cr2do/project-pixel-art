import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Grid3X3, Paintbrush, Clock, ArrowRight } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import * as boardService from '@/services/pixelboard.service';
import * as userService from '@/services/user.service';
import { getApiError } from '@/services/api.utils';
import { PixelBoardStatus, type IPixelBoard } from '@/types';
import { STATUS_LABEL, getUserPixelCount } from '@/utils/pixelboard.utils';
import type { UserStats } from '@/services/user.service';

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BoardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserDashboardPage() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<IPixelBoard[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    boardService
      .getAll()
      .then(setBoards)
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoadingBoards(false));

    userService
      .getMyStats()
      .then(setStats)
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoadingStats(false));
  }, []);

  const activeBoards = boards.filter((b) => b.status === PixelBoardStatus.IN_PROGRESS);
  const finishedBoards = boards.filter((b) => b.status === PixelBoardStatus.FINISHED);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Bonjour, {user?.firstname}
        </h2>
        <p className="text-muted-foreground">
          Voici un aperçu de votre activité sur PixelBoard.
        </p>
      </div>

      {loadingStats || loadingBoards ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pixels placés</CardTitle>
              <Paintbrush className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalPixels ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Sur {stats?.boardsContributed ?? 0} board(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Boards en cours</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeBoards.length}</div>
              <p className="text-xs text-muted-foreground">Participation active</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Boards terminés</CardTitle>
              <Grid3X3 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{finishedBoards.length}</div>
              <p className="text-xs text-muted-foreground">Contributions finalisées</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Boards récents</h3>
          <Button variant="ghost" size="sm" asChild>
            <NavLink to="/my-boards">
              Voir tout
              <ArrowRight className="ml-1 size-4" />
            </NavLink>
          </Button>
        </div>

        {loadingBoards ? (
          <BoardsSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.slice(0, 3).map((board: IPixelBoard) => (
              <NavLink key={board.id} to={`/boards/${board.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">
                        {board.name}
                      </CardTitle>
                      <Badge
                        variant={board.status === PixelBoardStatus.IN_PROGRESS ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {STATUS_LABEL[board.status]}
                      </Badge>
                    </div>
                    <CardDescription>
                      {board.width} x {board.height} pixels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mes pixels</span>
                      <span className="font-medium">
                        {user ? getUserPixelCount(board, user.id) : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Délai</span>
                      <span className="font-medium">{board.delay_seconds}s</span>
                    </div>
                  </CardContent>
                </Card>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboardPage;
