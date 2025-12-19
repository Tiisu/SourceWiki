import React, { useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import { Navigation } from './components/Navigation';
import {
  LandingPage,
  AuthPage,
  AdminAuditLogs,
  SubmissionForm,
  AdminDashboard,
  PublicDirectory,
  BulkUserManagement,
  UserProfile,
  SettingsPage,
} from './pages';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { initializeData } from './lib/mock-data';

function NotFound() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2">Page not found</p>
      <Link to="/" className="text-blue-600 underline mt-4 inline-block">
        Go back home
      </Link>
    </div>
  );
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppContent() {
  useEffect(() => {
    initializeData();
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <Navigation />

        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/submit" element={<SubmissionForm />} />
            <Route path="/directory" element={<PublicDirectory />} />
            <Route path="/profile" element={<UserProfile />} />

            {/* Admin routes protected */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <BulkUserManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <AdminRoute>
                  <AdminAuditLogs />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <SettingsPage />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Toaster position="top-right" />

        {/* Footer */}
        <footer className="border-t mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="mb-3">About WikiSourceVerifier</h3>
                <p className="text-sm text-gray-600">
                  A community-driven platform for verifying Wikipedia
                  references and maintaining source quality standards.
                </p>
              </div>
              <div>
                <h3 className="mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      to="/directory"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Browse Directory
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/submit"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Submit Reference
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/auth"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Login / Register
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3">Resources</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Wikipedia Verifiability Guidelines</li>
                  <li>Reliable Sources Policy</li>
                  <li>Community Guidelines</li>
                  <li>API Documentation</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
              <p>© 2025 WikiSourceVerifier. Built for the Wikipedia community.</p>
              <p className="mt-2">
                This is a demonstration platform. For production use, connect to a real backend service.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
