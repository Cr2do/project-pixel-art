import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getAdminDashboardData,
  applyDefaultDelay,
  toggleOverridePolicy,
  PixelBoardStatus,
  type AdminDashboardData,
} from '@/services/admin.service';

function AdminSettingsPage() {
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
        setError('Impossible de charger les paramètres.');
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const defaultDelay = useMemo(() => {
    if (!data) return 60;
    const activeBoards = data.pixelBoards.filter(
      (b) => b.status === PixelBoardStatus.IN_PROGRESS,
    );
    return activeBoards.length > 0 ? activeBoards[0].delay_seconds : 60;
  }, [data]);

  const overrideEnabled = useMemo(
    () =>
      data?.pixelBoards.some(
        (b) => b.status === PixelBoardStatus.IN_PROGRESS && b.allow_override,
      ) ?? false,
    [data],
  );

  const runAction = async (
    action: () => Promise<AdminDashboardData>,
    message: string,
  ) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await action();
      setData(updated);
      setFeedback(message);
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
        <h2 className="text-2xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground">
          Configuration globale de la plateforme.
        </p>
      </div>

      {feedback && (
        <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {feedback}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Délai par défaut</CardTitle>
            <CardDescription>
              Actuel : {defaultDelay}s sur les boards actifs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={() => {
                const next = defaultDelay >= 60 ? 30 : defaultDelay + 15;
                void runAction(
                  () => applyDefaultDelay(next),
                  `Délai par défaut réglé à ${next}s.`,
                );
              }}
            >
              Changer le délai
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Politique de superposition</CardTitle>
            <CardDescription>
              État actuel : {overrideEnabled ? 'Activée' : 'Désactivée'} sur les boards actifs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={() =>
                void runAction(toggleOverridePolicy, 'Politique mise à jour.')
              }
            >
              Basculer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminSettingsPage;
