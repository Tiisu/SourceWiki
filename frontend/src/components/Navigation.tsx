import { Link, useLocation, useNavigate } from 'react-router-dom';
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

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-8 w-8" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">WikiSourceVerifier</span>
                <span className="text-xs text-gray-500">Community Reference Platform</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Button
                variant={isActive('/directory') ? 'default' : 'ghost'}
                onClick={() => navigate('/directory')}
                className="flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Directory</span>
              </Button>

              {user && (
                <>
                  <Button
                    variant={isActive('/submit') ? 'default' : 'ghost'}
                    onClick={() => navigate('/submit')}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Submit</span>
                  </Button>

                  {(user.role === 'admin' || user.role === 'verifier') && (
                    <Button
                      variant={isActive('/admin') ? 'default' : 'ghost'}
                      onClick={() => navigate('/admin')}
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
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
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
              <Button onClick={() => navigate('/auth')} className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-1 pb-3 overflow-x-auto">
          <Button
            variant={isActive('/directory') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/directory')}
          >
            <Search className="h-4 w-4 mr-1" />
            Directory
          </Button>

          {user && (
            <>
              <Button
                variant={isActive('/submit') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/submit')}
              >
                <Upload className="h-4 w-4 mr-1" />
                Submit
              </Button>

              {(user.role === 'admin' || user.role === 'verifier') && (
                <Button
                  variant={isActive('/admin') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/admin')}
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
