import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  
  // Use a ref to prevent double execution in strict mode
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      navigate('/auth');
      return;
    }

    if (accessToken && refreshToken) {
      loginWithTokens(accessToken, refreshToken).then(success => {
        if (success) {
          navigate('/');
        } else {
          navigate('/auth');
        }
      });
    } else {
      toast.error('Authentication failed: Missing tokens');
      navigate('/auth');
    }
  }, [searchParams, navigate, loginWithTokens]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-gray-800">Completing sign in...</h2>
      <p className="text-gray-500 mt-2">Please wait while we redirect you.</p>
    </div>
  );
};
