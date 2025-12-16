import React, { useEffect } from 'react';
import { Routes, Route, Link, Navigate, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage, AuthPage, SubmissionForm, AdminDashboard, PublicDirectory, UserProfile } from './pages';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { initializeData } from './lib/mock-data';
import { TooltipProvider } from './components/ui/tooltip'; // only if TooltipProvider is needed

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
              <Route path="/directory" element={<PublicDirectory />} />

              {/* Protected Routes */}
              <Route
                path="/submit"
                element={
                  <ProtectedRoute>
                    <SubmissionForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* Admin Route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
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
                    A community-driven platform for verifying Wikipedia references and maintaining source quality standards.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3">Quick Links</h3>
                  <ul className="space-y-2 text-sm">
                    <li><Link to="/directory">Browse Directory</Link></li>
                    <li><Link to="/submit">Submit Reference</Link></li>
                    <li><Link to="/auth">Login / Register</Link></li>
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
                <p className="mt-2">This is a demonstration platform. For production use, connect to a real backend service.</p>
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
