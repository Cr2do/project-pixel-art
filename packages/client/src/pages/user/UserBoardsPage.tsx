import { NavLink } from 'react-router-dom';
import { Grid3X3, ArrowUpDown } from 'lucide-react';
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
import { useAuth } from '@/context/AuthContext';
import { MOCK_PIXELBOARDS } from '@/mocks/pixelboard.mock';
import { PixelBoardStatus } from '@/types';
import { STATUS_LABEL, getUserPixelCount } from '@/utils/pixelboard.utils';

function UserBoardsPage() {
  const { user } = useAuth();
  const boards = MOCK_PIXELBOARDS;

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

      {/* Resume */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boards.length} boards</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pixels placés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPixels}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {boards.filter((b) => b.status === PixelBoardStatus.IN_PROGRESS).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Header liste */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tous les boards</h3>
        <Button variant="outline" size="sm" disabled>
          <ArrowUpDown className="mr-2 size-4" />
          Trier
        </Button>
      </div>

      {/* Liste des boards */}
      {boards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Grid3X3 className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucune contribution</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vous n'avez pas encore participé à un PixelBoard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => {
            const myPixels = user ? getUserPixelCount(board, user.id) : 0;
            const totalBoardPixels = board.contributions.reduce(
              (sum, c) => sum + c.nb_pixels_placed,
              0,
            );
            const percentage =
              totalBoardPixels > 0
                ? Math.round((myPixels / totalBoardPixels) * 100)
                : 0;

            return (
              <NavLink key={board.id} to={`/boards/${board.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">
                        {board.name}
                      </CardTitle>
                      <Badge
                        variant={
                          board.status === PixelBoardStatus.IN_PROGRESS
                            ? 'default'
                            : 'secondary'
                        }
                        className="shrink-0"
                      >
                        {STATUS_LABEL[board.status]}
                      </Badge>
                    </div>
                    <CardDescription>
                      {board.width} x {board.height} pixels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mes pixels</span>
                      <span className="font-medium">{myPixels}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Ma contribution
                      </span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    {/* Barre de progression */}
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Contributeurs
                      </span>
                      <span className="font-medium">
                        {board.contributions.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserBoardsPage;
