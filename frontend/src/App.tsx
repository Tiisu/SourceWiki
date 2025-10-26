import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { Navigation } from './components/Navigation';
import { LandingPage, AuthPage, SubmissionForm, AdminDashboard, PublicDirectory, UserProfile } from './pages';
import { Toaster } from './components/ui/sonner';
import { initializeData } from './lib/mock-data';

function AppContent() {
  useEffect(() => {
    // Initialize mock data in localStorage
    initializeData();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/submit" element={<SubmissionForm />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/directory" element={<PublicDirectory />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
                  A community-driven platform for verifying Wikipedia references and maintaining
                  source quality standards.
                </p>
              </div>
              <div>
                <h3 className="mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/directory" className="text-gray-600 hover:text-gray-900">
                      Browse Directory
                    </a>
                  </li>
                  <li>
                    <a href="/submit" className="text-gray-600 hover:text-gray-900">
                      Submit Reference
                    </a>
                  </li>
                  <li>
                    <a href="/auth" className="text-gray-600 hover:text-gray-900">
                      Login / Register
                    </a>
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
                This is a demonstration platform. For production use, connect to a real backend
                service.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
