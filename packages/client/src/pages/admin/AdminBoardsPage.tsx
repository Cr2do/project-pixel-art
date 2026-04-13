import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getAdminDashboardData,
  increaseBoardDelay,
  PixelBoardStatus,
  type AdminDashboardData,
} from '@/services/admin.service';

function AdminBoardsPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getAdminDashboardData();
        setData(response);
      } catch {
        setError('Impossible de charger les boards.');
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const handleIncreaseDelay = async (boardId: string, name: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await increaseBoardDelay(boardId);
      setData(updated);
      setFeedback(`Délai augmenté pour ${name}.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Action échouée.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;
  if (error || !data) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">PixelBoards</h2>
        <p className="text-muted-foreground">Gérez les boards de la plateforme.</p>
      </div>

      {feedback && (
        <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {feedback}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Boards</CardTitle>
          <CardDescription>
            Modifier le délai augmente de 15s (simulation).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.pixelBoards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun board disponible.</p>
          ) : (
            <div className="space-y-3">
              {data.pixelBoards.map((board) => (
                <div key={board.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{board.name}</p>
                    <Badge
                      variant={
                        board.status === PixelBoardStatus.IN_PROGRESS ? 'default' : 'secondary'
                      }
                    >
                      {board.status === PixelBoardStatus.IN_PROGRESS ? 'En cours' : 'Terminé'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {board.width}×{board.height} — délai {board.delay_seconds}s —{' '}
                    {board.contributorCount} contributeur(s)
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => void handleIncreaseDelay(board.id, board.name)}
                  >
                    Modifier le délai
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminBoardsPage;
