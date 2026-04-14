import { useEffect, useState } from 'react';
import { Clock3, SquareChartGantt, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  getAdminDashboardData,
  AdminActivityLevel,
  UserRole,
  type AdminDashboardData,
} from '@/services/admin.service';
import { formatDateTimeFR } from '@/utils/date.utils';

function AdminOverviewPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getAdminDashboardData();
        setData(response);
      } catch {
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;
  if (error || !data) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Vue globale de la plateforme.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.kpis.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              dont {data.kpis.totalAdmins} admin(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Boards actifs</CardTitle>
            <SquareChartGantt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.kpis.activeBoards}</div>
            <p className="text-xs text-muted-foreground">En cours de dessin</p>
          </CardContent>
        </Card>

        {/* Modération supprimée */}
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comptes récents</CardTitle>
          </CardHeader>
          <CardContent>
            {data.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
            ) : (
              <div className="space-y-3">
                {data.users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {user.firstname} {user.lastname}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {data.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité.</p>
            ) : (
              <div className="space-y-2">
                {data.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`rounded-lg border p-3 text-sm ${
                      activity.level === AdminActivityLevel.WARNING
                        ? 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100'
                        : 'border-border bg-muted/50'
                    }`}
                  >
                    <p className="font-medium">{activity.message}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs opacity-70">
                      <Clock3 className="size-3" />
                      {formatDateTimeFR(activity.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminOverviewPage;
