import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelLogo } from '@/components/common/PixelLogo';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-muted/20">
      <Link to="/" className="mb-8">
        <PixelLogo size="lg" />
      </Link>

      {/* Pixel art "404" decoration */}
      <div
        aria-hidden
        className="mb-8 font-mono text-8xl font-extrabold tracking-widest text-muted-foreground/20 select-none"
      >
        404
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Cette page n'existe pas ou a été supprimée. Revenez à l'accueil pour
        continuer à dessiner.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 size-4" />
            Retour à l'accueil
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Page précédente
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;
