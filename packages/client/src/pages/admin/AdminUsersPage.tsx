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
  toggleUserRole,
  UserRole,
  type AdminDashboardData,
} from '@/services/admin.service';

function AdminUsersPage() {
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
        setError('Impossible de charger les utilisateurs.');
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const handleToggleRole = async (userId: string, firstname: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await toggleUserRole(userId);
      setData(updated);
      setFeedback(`Rôle mis à jour pour ${firstname}.`);
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
        <h2 className="text-2xl font-bold tracking-tight">Utilisateurs</h2>
        <p className="text-muted-foreground">Gérez les rôles des comptes.</p>
      </div>

      {feedback && (
        <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {feedback}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Comptes</CardTitle>
          <CardDescription>
            {data.users.length} utilisateur(s) enregistré(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun utilisateur disponible.</p>
          ) : (
            <div className="space-y-3">
              {data.users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {user.firstname} {user.lastname}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => void handleToggleRole(user.id, user.firstname)}
                    >
                      Changer le rôle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsersPage;
