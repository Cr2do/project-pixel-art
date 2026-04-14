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
import { useNavigate } from 'react-router-dom';
import {
  adminDeletePixelBoard,
  adminCreatePixelBoard,
  adminUpdatePixelBoard,
  getAdminDashboardData,
  PixelBoardStatus,
  type AdminDashboardData,
  type AdminPixelBoard,
} from '@/services/admin.service';

function AdminBoardsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<AdminPixelBoard | null>(null);

  const [editName, setEditName] = useState('');
  const [editDelay, setEditDelay] = useState<number>(60);
  const [editAllowOverride, setEditAllowOverride] = useState(false);
  const [editStatus, setEditStatus] = useState<PixelBoardStatus>(PixelBoardStatus.IN_PROGRESS);

  const [createName, setCreateName] = useState('');
  const [createWidth, setCreateWidth] = useState<number>(32);
  const [createHeight, setCreateHeight] = useState<number>(32);
  const [createDelay, setCreateDelay] = useState<number>(60);
  const [createAllowOverride, setCreateAllowOverride] = useState(false);
  const [createStatus, setCreateStatus] = useState<PixelBoardStatus>(PixelBoardStatus.IN_PROGRESS);

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

  const openCreate = () => {
    setCreateName('');
    setCreateWidth(32);
    setCreateHeight(32);
    setCreateDelay(60);
    setCreateAllowOverride(false);
    setCreateStatus(PixelBoardStatus.IN_PROGRESS);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminCreatePixelBoard({
        name: createName,
        width: createWidth,
        height: createHeight,
        delay_seconds: createDelay,
        allow_override: createAllowOverride,
        status: createStatus,
      });
      await refresh();
      setCreateOpen(false);
      setFeedback('Board créé avec succès.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Création échouée.');
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

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={openCreate} disabled={actionLoading}>
          Créer un board
        </Button>
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
                      variant="secondary"
                      disabled={actionLoading}
                      onClick={() => navigate(`/boards/${board.id}`)}
                    >
                      Jouer
                    </Button>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un PixelBoard</DialogTitle>
            <DialogDescription>
              Créez un nouveau board (taille max 1000×1000).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-board-name">Nom</Label>
              <Input
                id="create-board-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="create-board-width">Largeur</Label>
                <Input
                  id="create-board-width"
                  type="number"
                  min={1}
                  max={1000}
                  value={Number.isFinite(createWidth) ? createWidth : 1}
                  onChange={(e) => setCreateWidth(Number(e.target.value))}
                  disabled={actionLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-board-height">Hauteur</Label>
                <Input
                  id="create-board-height"
                  type="number"
                  min={1}
                  max={1000}
                  value={Number.isFinite(createHeight) ? createHeight : 1}
                  onChange={(e) => setCreateHeight(Number(e.target.value))}
                  disabled={actionLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-board-delay">Délai (secondes)</Label>
              <Input
                id="create-board-delay"
                type="number"
                min={0}
                value={Number.isFinite(createDelay) ? createDelay : 0}
                onChange={(e) => setCreateDelay(Number(e.target.value))}
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
                checked={createAllowOverride}
                onCheckedChange={setCreateAllowOverride}
                disabled={actionLoading}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Statut</p>
                <p className="text-xs text-muted-foreground">
                  {createStatus === PixelBoardStatus.IN_PROGRESS ? 'En cours' : 'Terminé'}
                </p>
              </div>
              <Switch
                checked={createStatus === PixelBoardStatus.IN_PROGRESS}
                onCheckedChange={(checked) =>
                  setCreateStatus(
                    checked ? PixelBoardStatus.IN_PROGRESS : PixelBoardStatus.FINISHED,
                  )
                }
                disabled={actionLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={actionLoading}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={
                actionLoading ||
                createName.trim() === '' ||
                !Number.isFinite(createWidth) ||
                !Number.isFinite(createHeight) ||
                createWidth <= 0 ||
                createHeight <= 0
              }
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminBoardsPage;
