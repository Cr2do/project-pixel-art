import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Users,
  Layers,
  Paintbrush,
  ArrowRight,
  Grid3X3,
  Zap,
  Trophy,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PixelLogo } from '@/components/common/PixelLogo';
import { useAuth } from '@/context/AuthContext';
import * as mapService from '@/services/map.service';
import type { GlobalMapResponse } from '@/services/map.service';
import { getApiError } from '@/services/api.utils';
import { GlobalMapCanvas } from '@/components/map/GlobalMapCanvas';

const FEATURES = [
  {
    icon: Paintbrush,
    title: 'Dessinez en temps réel',
    description:
      'Posez vos pixels sur une toile partagée et voyez les contributions des autres utilisateurs se former sous vos yeux.',
  },
  {
    icon: Clock,
    title: 'Cooldown par pixel',
    description:
      'Un délai entre chaque pixel garantit une participation équitable. Chaque coup de pinceau compte vraiment.',
  },
  {
    icon: Users,
    title: 'Communauté créative',
    description:
      'Rejoignez des boards thématiques, collaborez avec des artistes du monde entier et signez vos œuvres collectives.',
  },
  {
    icon: Layers,
    title: 'Superposition ou unique',
    description:
      'Certains boards permettent d\'écraser les pixels existants, d\'autres non — deux façons de créer, deux ambiances différentes.',
  },
];

const STATS = [
  { label: 'Boards actifs', value: '12', icon: Grid3X3 },
  { label: 'Pixels placés', value: '84 000+', icon: Paintbrush },
  { label: 'Artistes', value: '320+', icon: Users },
  { label: 'Œuvres terminées', value: '8', icon: Trophy },
];

function HomeNavbar() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <PixelLogo size="md" />

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Fonctionnalités
          </a>
          <a href="#boards" className="text-muted-foreground hover:text-foreground transition-colors">
            Boards
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Changer le thème"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {isAuthenticated ? (
            <Button asChild>
              <Link to={isAdmin ? '/admin' : '/dashboard'}>
                Tableau de bord
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Connexion</Link>
              </Button>
              <Button asChild>
                <Link to="/register">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Pixel grid background decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, currentColor, currentColor 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, currentColor, currentColor 1px, transparent 1px, transparent 24px)',
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Zap className="size-3" />
            Pixel art collaboratif en temps réel
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Dessinez ensemble,{' '}
            <span className="text-primary">pixel par pixel</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            PixelBoard est une toile collaborative où chaque utilisateur place
            ses pixels sur des boards partagés. Créez, contribuez, et laissez
            votre empreinte sur l'art collectif.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to={isAdmin ? '/admin' : '/dashboard'}>
                  Accéder à mon espace
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/register">
                    Créer un compte gratuit
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Se connecter</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mock pixel canvas preview */}
        <div className="mx-auto mt-16 max-w-lg">
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-yellow-400" />
                  <div className="size-3 rounded-full bg-green-400" />
                </div>
                <Badge variant="default" className="text-xs">
                  En cours
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <PixelPreview />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function PixelPreview() {
  const palette = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
    '#f8fafc', '#94a3b8', '#1e293b', '#fbbf24',
  ];

  const grid = Array.from({ length: 16 * 16 }, (_, i) => {
    const seed = (i * 1103515245 + 12345) & 0x7fffffff;
    return seed % 4 === 0 ? palette[seed % palette.length] : null;
  });

  return (
    <div
      className="mx-auto aspect-square w-full max-w-xs rounded border"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(16, 1fr)',
      }}
    >
      {grid.map((color, i) => (
        <div
          key={i}
          style={{ backgroundColor: color ?? 'transparent' }}
          className={color ? '' : 'bg-muted/30'}
        />
      ))}
    </div>
  );
}

function StatsBar() {
  return (
    <section className="border-y bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Comment ça fonctionne ?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Un système simple mais profond pour créer ensemble.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="group transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="size-5 text-primary" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}



function ActiveBoardsSection() {
  const [mapData, setMapData] = useState<GlobalMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    mapService
      .getGlobalMap()
      .then(setMapData)
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="boards" className="py-20 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Boards actifs</h2>
            <p className="mt-1 text-muted-foreground">
              Carte mondiale — tous les PixelBoards en un coup d'œil.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={isAuthenticated ? '/explore' : '/register'}>
              Voir tous les boards
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <Skeleton className="w-full h-125 rounded-lg" />
        ) : !mapData || mapData.boards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Grid3X3 className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun board disponible pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          <GlobalMapCanvas data={mapData} />
        )}
      </div>
    </section>
  );
}

function CtaBanner() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Card className="overflow-hidden bg-primary text-primary-foreground border-0">
          <CardContent className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <Grid3X3 className="size-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Prêt à laisser votre empreinte ?
              </h2>
              <p className="mt-3 text-primary-foreground/80">
                Créez un compte gratuit et placez votre premier pixel en moins
                d'une minute.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/login">Se connecter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function HomeFooter() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <PixelLogo size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PixelBoard. Projet collaboratif.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">
              Connexion
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link to="/register" className="hover:text-foreground transition-colors">
              Inscription
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <ActiveBoardsSection />
        <CtaBanner />
      </main>
      <HomeFooter />
    </div>
  );
}

export default HomePage;
