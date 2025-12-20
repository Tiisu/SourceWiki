import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Upload, 
  User, 
  LogOut, 
  Award, 
  Shield, 
  LogIn, 
  Menu,
  Settings,
  Users,
  FileText
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl hidden sm:block">WikiSourceVerifier</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/directory" 
              className={`text-sm font-medium hover:text-blue-600 ${isActive('/directory') ? 'text-blue-600' : 'text-gray-600'}`}
            >
              Directory
            </Link>
            <Link 
              to="/submit" 
              className={`text-sm font-medium hover:text-blue-600 ${isActive('/submit') ? 'text-blue-600' : 'text-gray-600'}`}
            >
              Submit Reference
            </Link>

            {/* Admin Links (Only for Admin) */}
            {user?.role === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium gap-1 text-blue-700">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                    <Users className="mr-2 h-4 w-4" /> Bulk Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/audit-logs')}>
                    <FileText className="mr-2 h-4 w-4" /> Audit Logs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* User Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-700 font-bold">{user.username[0].toUpperCase()}</span>
                    </div>
                    <span className="hidden sm:inline-block">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.username}</span>
                      <span className="text-xs text-gray-500 font-normal">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  {user.points !== undefined && (
                    <div className="px-2 py-1.5 text-sm flex items-center justify-between text-yellow-600 bg-yellow-50 my-1 rounded">
                      <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Points</span>
                      <span className="font-bold">{user.points}</span>
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/auth')}>Log in</Button>
                <Button onClick={() => navigate('/auth?mode=register')}>Get Started</Button>
              </div>
            )}

            {/* Mobile Menu Button (Sheet) */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-6">
                  <Link to="/directory" onClick={() => setIsOpen(false)} className="text-lg font-medium">Directory</Link>
                  <Link to="/submit" onClick={() => setIsOpen(false)} className="text-lg font-medium">Submit Reference</Link>
                  
                  {user?.role === 'admin' && (
                    <>
                      <div className="h-px bg-gray-200 my-2" />
                      <p className="text-sm text-gray-500 uppercase font-bold">Admin</p>
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="text-lg">Dashboard</Link>
                      <Link to="/admin/users" onClick={() => setIsOpen(false)} className="text-lg">Bulk Users</Link>
                      <Link to="/admin/audit-logs" onClick={() => setIsOpen(false)} className="text-lg">Audit Logs</Link>
                      <Link to="/admin/settings" onClick={() => setIsOpen(false)} className="text-lg">Settings</Link>
                    </>
                  )}

                  {!user && (
                    <div className="flex flex-col gap-2 mt-4">
                      <Button onClick={() => { navigate('/auth'); setIsOpen(false); }}>Log in</Button>
                      <Button variant="outline" onClick={() => { navigate('/auth?mode=register'); setIsOpen(false); }}>Register</Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}