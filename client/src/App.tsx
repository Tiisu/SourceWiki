import { useState, useEffect } from 'react';
import { AuthProvider } from './lib/auth-context';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { SubmissionForm } from './components/SubmissionForm';
import { AdminDashboard } from './components/AdminDashboard';
import { PublicDirectory } from './components/PublicDirectory';
import { UserProfile } from './components/UserProfile';
import { Toaster } from './components/ui/sonner';
import { initializeData } from './lib/mock-data';

type Page = 'landing' | 'auth' | 'submit' | 'admin' | 'directory' | 'profile';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  useEffect(() => {
    // Initialize mock data in localStorage
    initializeData();
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'auth':
        return <AuthPage onNavigate={handleNavigate} />;
      case 'submit':
        return <SubmissionForm onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'directory':
        return <PublicDirectory onNavigate={handleNavigate} />;
      case 'profile':
        return <UserProfile onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
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
                  <button
                    onClick={() => handleNavigate('directory')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Browse Directory
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('submit')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Submit Reference
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('auth')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Login / Register
                  </button>
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
