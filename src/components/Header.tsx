
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Search, Trophy, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from './ThemeProvider';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { name: 'Search', href: '/', icon: <Search className="mr-2 h-4 w-4" /> },
    { name: 'Leaderboard', href: '/leaderboard', icon: <Trophy className="mr-2 h-4 w-4" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="w-full fixed top-0 z-50 glass-morphism">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Legend League Tracker</span>
          </Link>
        </div>

        {isMobile ? (
          <>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
            
            {isMenuOpen && (
              <div className="absolute top-full left-0 right-0 glass-morphism animate-scale-in">
                <nav className="container mx-auto py-4">
                  <ul className="flex flex-col space-y-2">
                    {navLinks.map((link) => (
                      <li key={link.name}>
                        <Link 
                          to={link.href}
                          className={cn(
                            "flex items-center px-4 py-3 rounded-lg transition-colors",
                            isActive(link.href) 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-secondary"
                          )}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {link.icon}
                          <span>{link.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <nav>
              <ul className="flex items-center space-x-1">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive(link.href) 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-secondary"
                      )}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <ThemeToggle />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
