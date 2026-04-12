import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
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
  resolveOneReport,
  type AdminDashboardData,
} from '@/services/admin.service';

function AdminModerationPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await getAdminDashboardData();
        setData(response);
      } catch {
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const handleResolve = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await resolveOneReport();
      setData(updated);
      setFeedback('Un signalement traité.');
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
        <h2 className="text-2xl font-bold tracking-tight">Modération</h2>
        <p className="text-muted-foreground">
          Gérez les signalements de la plateforme.
        </p>
      </div>

      {feedback && (
        <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {feedback}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Signalements en attente</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {data.kpis.pendingReports}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rapports à examiner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traitement</CardTitle>
            <CardDescription>
              Assigner un modérateur par board actif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              disabled={actionLoading || data.kpis.pendingReports === 0}
              onClick={() => void handleResolve()}
            >
              Traiter un signalement
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminModerationPage;
