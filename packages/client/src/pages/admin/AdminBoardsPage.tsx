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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  adminDeletePixelBoard,
  adminUpdatePixelBoard,
  getAdminDashboardData,
  PixelBoardStatus,
  type AdminDashboardData,
  type AdminPixelBoard,
} from '@/services/admin.service';

function AdminBoardsPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<AdminPixelBoard | null>(null);

  const [editName, setEditName] = useState('');
  const [editDelay, setEditDelay] = useState<number>(60);
  const [editAllowOverride, setEditAllowOverride] = useState(false);
  const [editStatus, setEditStatus] = useState<PixelBoardStatus>(PixelBoardStatus.IN_PROGRESS);

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

  const refresh = async () => {
    const response = await getAdminDashboardData();
    setData(response);
  };

  const openEdit = (board: AdminPixelBoard) => {
    setSelectedBoard(board);
    setEditName(board.name);
    setEditDelay(board.delay_seconds);
    setEditAllowOverride(board.allow_override);
    setEditStatus(board.status);
    setEditOpen(true);
  };

  const openDelete = (board: AdminPixelBoard) => {
    setSelectedBoard(board);
    setDeleteOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBoard) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      await adminUpdatePixelBoard(selectedBoard.id, {
        name: editName,
        delay_seconds: editDelay,
        allow_override: editAllowOverride,
        status: editStatus,
      });
      await refresh();
      setEditOpen(false);
      setSelectedBoard(null);
      setFeedback('Board modifié avec succès.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Modification échouée.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBoard) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminDeletePixelBoard(selectedBoard.id);
      await refresh();
      setDeleteOpen(false);
      setSelectedBoard(null);
      setFeedback('Board supprimé.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Suppression échouée.');
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
            Modifier / supprimer un PixelBoard.
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => openEdit(board)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => openDelete(board)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le PixelBoard</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres du board sélectionné.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Nom</Label>
              <Input
                id="board-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-delay">Délai (secondes)</Label>
              <Input
                id="board-delay"
                type="number"
                min={0}
                value={Number.isFinite(editDelay) ? editDelay : 0}
                onChange={(e) => setEditDelay(Number(e.target.value))}
                disabled={actionLoading}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Allow override</p>
                <p className="text-xs text-muted-foreground">
                  Autoriser l'écrasement des pixels.
                </p>
              </div>
              <Switch
                checked={editAllowOverride}
                onCheckedChange={setEditAllowOverride}
                disabled={actionLoading}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Statut</p>
                <p className="text-xs text-muted-foreground">
                  {editStatus === PixelBoardStatus.IN_PROGRESS ? 'En cours' : 'Terminé'}
                </p>
              </div>
              <Switch
                checked={editStatus === PixelBoardStatus.IN_PROGRESS}
                onCheckedChange={(checked) =>
                  setEditStatus(checked ? PixelBoardStatus.IN_PROGRESS : PixelBoardStatus.FINISHED)
                }
                disabled={actionLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={actionLoading}>
              Annuler
            </Button>
            <Button onClick={() => void handleSaveEdit()} disabled={actionLoading || editName.trim() === ''}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le PixelBoard</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les pixels associés seront aussi supprimés.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm">
            Confirmer la suppression de <span className="font-semibold">{selectedBoard?.name}</span> ?
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={actionLoading}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirmDelete()} disabled={actionLoading}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminBoardsPage;
