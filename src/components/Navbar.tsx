import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, LayoutDashboard, GitCompare, Menu, X, LogIn, LogOut, User, Shield } from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const wishlistCount = useStore((state) => state.wishlist.length);
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  const navLinks = [
    { to: '/wishlist', label: 'Wishlist', icon: Heart, count: wishlistCount },
    { to: '/bandingkan', label: 'Bandingkan', icon: GitCompare },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal logout. Silakan coba lagi.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Berhasil Logout',
      description: 'Sampai jumpa lagi!',
    });
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive(link.to) ? 'default' : 'ghost'}
                  size="sm"
                  className="relative"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {link.count && link.count > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {link.count}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}

            {/* Auth Section */}
            {!loading && (
              <>
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="ml-2 gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:inline max-w-24 truncate">
                          {user?.email?.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                        {user?.email}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="ml-2">
                      <LogIn className="h-4 w-4" />
                      Masuk
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(link.to) ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <link.icon className="h-4 w-4 mr-2" />
                    <span>{link.label}</span>
                    {link.count && link.count > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {link.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}

              {/* Mobile Auth */}
              {!loading && (
                <>
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-sm text-muted-foreground border-t border-border mt-2 pt-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="truncate">{user?.email}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive"
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="default" className="w-full mt-2">
                        <LogIn className="h-4 w-4 mr-2" />
                        Masuk / Daftar
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
