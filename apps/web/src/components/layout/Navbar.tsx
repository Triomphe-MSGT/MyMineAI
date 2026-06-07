import { Link } from 'react-router-dom';
import { Video, LogOut } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/common/Button';

export function Navbar() {
  const { user, logout } = useUserStore();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <Video className="h-5 w-5" />
          MyMeet
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-1 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
