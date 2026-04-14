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
  const [defaultDelayInput, setDefaultDelayInput] = useState<number>(60);
  const [isDelayDirty, setIsDelayDirty] = useState(false);
  const [hasInitializedDelayInput, setHasInitializedDelayInput] = useState(false);

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
    const activeBoards = data.pixelBoards.filter((b) => b.status === PixelBoardStatus.IN_PROGRESS);
    if (activeBoards.length === 0) return 60;

    // Au lieu de prendre le premier board (non déterministe), on prend la valeur la plus fréquente.
    const freq = new Map<number, number>();
    for (const b of activeBoards) {
      freq.set(b.delay_seconds, (freq.get(b.delay_seconds) ?? 0) + 1);
    }
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? 60;
  }, [data]);

  // Initialise le champ UNE SEULE FOIS (au premier chargement), puis on ne le modifie plus automatiquement.
  // Sinon, le refresh après "Basculer" peut écraser la saisie avec une valeur (souvent 60s).
  useEffect(() => {
    if (hasInitializedDelayInput) return;
    if (!data) return;
    setDefaultDelayInput(defaultDelay);
    setHasInitializedDelayInput(true);
  }, [data, defaultDelay, hasInitializedDelayInput]);

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
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                className="h-10 w-28 rounded-md border bg-background px-3 py-2 text-sm"
                value={Number.isFinite(defaultDelayInput) ? defaultDelayInput : 0}
                onChange={(e) => {
                  setIsDelayDirty(true);
                  setDefaultDelayInput(Number(e.target.value));
                }}
                disabled={actionLoading}
              />
              <Button
                variant="outline"
                disabled={actionLoading || !Number.isFinite(defaultDelayInput) || defaultDelayInput < 0}
                onClick={() => {
                  const next = defaultDelayInput;
                  void runAction(
                    () => applyDefaultDelay(next),
                    `Délai par défaut réglé à ${next}s.`,
                  );
                  setIsDelayDirty(false);
                  // On considère l'input comme "initialisé" car l'utilisateur a choisi explicitement la valeur.
                  setHasInitializedDelayInput(true);
                }}
              >
                Appliquer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Politique de superposition</CardTitle>
            <CardDescription>
              État actuel : {overrideEnabled ? 'Activée' : 'Désactivée'} sur les boards actifs.
              <br />
              <span className="text-muted-foreground">
                NB : ce réglage contrôle uniquement la possibilité d'écraser un pixel existant. Même
                désactivé, on peut toujours jouer (placer un pixel) sur une case vide.
              </span>
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
