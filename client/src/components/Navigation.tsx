import { BookOpen, Search, Upload, User, LogOut, Award, Shield, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-8 w-8" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">WikiSourceVerifier</span>
                <span className="text-xs text-gray-500">Community Reference Platform</span>
              </div>
            </button>

            <div className="hidden md:flex items-center space-x-1">
              <Button
                variant={currentPage === 'directory' ? 'default' : 'ghost'}
                onClick={() => onNavigate('directory')}
                className="flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Directory</span>
              </Button>

              {user && (
                <>
                  <Button
                    variant={currentPage === 'submit' ? 'default' : 'ghost'}
                    onClick={() => onNavigate('submit')}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Submit</span>
                  </Button>

                  {(user.role === 'admin' || user.role === 'verifier') && (
                    <Button
                      variant={currentPage === 'admin' ? 'default' : 'ghost'}
                      onClick={() => onNavigate('admin')}
                      className="flex items-center space-x-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.username}</span>
                    <Badge variant="secondary" className="ml-2">
                      {user.points}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <span>{user.username}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('profile')}>
                    <Award className="h-4 w-4 mr-2" />
                    Badges ({user.badges.length})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => onNavigate('auth')} className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-1 pb-3 overflow-x-auto">
          <Button
            variant={currentPage === 'directory' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('directory')}
          >
            <Search className="h-4 w-4 mr-1" />
            Directory
          </Button>

          {user && (
            <>
              <Button
                variant={currentPage === 'submit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onNavigate('submit')}
              >
                <Upload className="h-4 w-4 mr-1" />
                Submit
              </Button>

              {(user.role === 'admin' || user.role === 'verifier') && (
                <Button
                  variant={currentPage === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate('admin')}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
