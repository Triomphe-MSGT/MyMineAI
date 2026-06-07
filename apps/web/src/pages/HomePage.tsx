import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, LogIn } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { roomApi } from '@/services/api';
import { useUserStore } from '@/stores/userStore';

export function HomePage() {
  const navigate = useNavigate();
  const { user, token } = useUserStore();
  const [roomName, setRoomName] = useState('');
  const [joinSlug, setJoinSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await roomApi.create(roomName || undefined);
      navigate(`/room/${res.data.slug}`);
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    const slug = joinSlug.trim().replace(/^\/room\//, '');
    if (slug) navigate(`/room/${slug}`);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Video className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h1 className="mb-3 text-4xl font-bold">MyMeet</h1>
        <p className="mb-10 text-lg text-muted-foreground">
          Visioconférence simple et rapide. Créez une room ou rejoignez-en une existante.
        </p>

        {!user ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">Connectez-vous pour commencer</p>
            <Button onClick={() => navigate('/login')} size="lg">
              <LogIn className="mr-2 h-5 w-5" />
              Se connecter
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-lg border border-border bg-card p-6 text-left">
              <h2 className="mb-4 font-semibold">Créer une nouvelle room</h2>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Nom de la room (optionnel)"
                className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={createRoom} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? 'Création...' : 'Nouvelle room'}
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 text-left">
              <h2 className="mb-4 font-semibold">Rejoindre une room</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  placeholder="Code de la room (ex: abc123)"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={joinRoom} variant="secondary">
                  Rejoindre
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-destructive">{error}</p>}
      </div>
    </AppLayout>
  );
}
