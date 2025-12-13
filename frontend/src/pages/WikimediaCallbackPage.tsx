import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { api, authApi } from '../lib/api';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const WikimediaCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');
      const message = searchParams.get('message');

      // Handle errors
      if (error) {
        console.error('OAuth 2.0 error:', error, message);
        toast.error(message || 'Authentication failed');
        navigate('/auth', { replace: true });
        return;
      }

      // Handle success
      if (accessToken && refreshToken) {
        try {
          // Set tokens in API client
          api.setTokens(accessToken, refreshToken);

          // Fetch user data
          const response = await authApi.getMe();
          if (response.success && response.user) {
            updateUser(response.user);
            toast.success('Successfully authenticated with Wikipedia!');
            
            // Redirect to home page after a brief delay
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 1500);
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          toast.error('Failed to complete authentication');
          navigate('/auth', { replace: true });
        }
      } else {
        // No tokens, redirect to auth page
        navigate('/auth', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, updateUser]);

  const error = searchParams.get('error');
  const accessToken = searchParams.get('accessToken');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {error ? (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Authentication Failed</CardTitle>
              <CardDescription>
                {searchParams.get('message') || 'An error occurred during authentication'}
              </CardDescription>
            </>
          ) : accessToken ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>Authentication Successful!</CardTitle>
              <CardDescription>
                Redirecting you to the application...
              </CardDescription>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <CardTitle>Processing Authentication</CardTitle>
              <CardDescription>
                Please wait while we complete your login...
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {!error && !accessToken && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

