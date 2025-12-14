import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../lib/auth-context';
import { COUNTRIES } from '../lib/mock-data';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerCountry, setRegisterCountry] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(loginUsername, loginPassword);
      if (success) {
        navigate('/');
      }
    } catch (error) {
      // Error already handled in auth context
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerCountry) {
      toast.error('Please select a country');
      return;
    }

    setLoading(true);

    try {
      const success = await register(registerUsername, registerEmail, registerPassword, registerCountry);
      if (success) {
        navigate('/');
      }
    } catch (error) {
      // Error already handled in auth context
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  const handleWikimediaLogin = async () => {
    // Prevent multiple simultaneous requests
    if (wikimediaLoading) {
      return;
    }
    
    setWikimediaLoading(true);
    try {
      console.log('🔐 Initiating Wikimedia OAuth...');
      const response = await authApi.initiateWikimediaOAuth();
      console.log('📥 OAuth response:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response keys:', response ? Object.keys(response) : 'null');
      
      // Backend returns 'authorizationUrl' (not 'authorizeUrl')
      const authUrl = response?.authorizationUrl || response?.authorizeUrl;
      
      console.log('🔍 Checking response:', {
        hasResponse: !!response,
        hasSuccess: response?.success,
        successValue: response?.success,
        hasAuthUrl: !!authUrl,
        authUrlValue: authUrl ? authUrl.substring(0, 100) + '...' : 'null',
        responseKeys: response ? Object.keys(response) : []
      });
      
      if (response && response.success === true && authUrl && typeof authUrl === 'string') {
        console.log('✅ All checks passed. Redirecting to:', authUrl);
        // Use window.location.replace to prevent back button issues
        window.location.replace(authUrl);
        // Don't set loading to false since we're redirecting
        return;
      } else {
        console.error('❌ Invalid response structure:', {
          response,
          success: response?.success,
          authUrl,
          authUrlType: typeof authUrl,
          responseType: typeof response
        });
        const errorMsg = !response 
          ? 'No response from server' 
          : !response.success 
          ? `Response indicates failure: ${response.message || 'Unknown error'}`
          : !authUrl 
          ? 'No authorization URL in response'
          : 'Invalid response format';
        toast.error(`Failed to initiate Wikipedia login: ${errorMsg}`);
        setWikimediaLoading(false);
      }
    } catch (error) {
      console.error('❌ OAuth error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Wikipedia';
      toast.error(`Failed to initiate Wikipedia login: ${errorMessage}`);
      setWikimediaLoading(false);
    }
  };


>>>>>>> 718cf8f (Add OAuth 1.0a implementation with fallback support)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="mb-2">Welcome to WikiSourceVerifier</h1>
          <p className="text-gray-600">Sign in or create an account to get started</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Your username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Demo accounts:</strong>
                      <br />• WikiEditor2024 (Contributor)
                      <br />• SourceVerifier (Verifier)
                      <br />• AdminUser (Admin)
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join the Wikipedia source verification community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-country">Country</Label>
                    <Select value={registerCountry} onValueChange={setRegisterCountry}>
                      <SelectTrigger id="register-country">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="bg-amber-50 p-4 rounded-md">
                    <p className="text-sm text-amber-800">
                      By registering, you agree to help maintain Wikipedia's source quality standards.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
