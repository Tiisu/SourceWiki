import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const WIKIMEDIA_ERRORS: Record<string, string> = {
  access_denied: 'You cancelled the Wikimedia login.',
  invalid_state: 'The login could not be verified. Please try again.',
  token_exchange_failed: 'Wikimedia did not accept the login. Please try again.',
  profile_failed: 'Could not read your Wikimedia profile. Please try again.',
  account_inactive: 'This account is deactivated.',
  server_error: 'Something went wrong on our side. Please try again.',
};

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, login, register, updateUser, loginWithWikimedia } = useAuth();
  const [loading, setLoading] = useState(false);

  // What the backend tells us after the Wikimedia round trip (?wikimedia=success or error)
  const wikimediaStatus = searchParams.get('wikimedia');
  const wikimediaReason = searchParams.get('reason');

  // Country picker shown to new Wikimedia users
  const [wikimediaCountry, setWikimediaCountry] = useState('');
  const [savingCountry, setSavingCountry] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerCountry, setRegisterCountry] = useState('');

  // Wikimedia login failed: show the reason, then clean the URL
  useEffect(() => {
    if (wikimediaStatus !== 'error') return;
    toast.error(WIKIMEDIA_ERRORS[wikimediaReason || ''] || 'Wikimedia login failed.');
    setSearchParams({}, { replace: true });
  }, [wikimediaStatus, wikimediaReason, setSearchParams]);

  // Wikimedia login succeeded: once the user is loaded and has a country, go to the app
  useEffect(() => {
    if (wikimediaStatus !== 'success' || authLoading) return;

    if (!user) {
      toast.error('Could not complete the Wikimedia login. Please try again.');
      setSearchParams({}, { replace: true });
      return;
    }

    if (user.country) {
      toast.success('Logged in with Wikimedia');
      navigate('/', { replace: true });
    }
  }, [wikimediaStatus, authLoading, user, navigate, setSearchParams]);

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

  const handleSaveWikimediaCountry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wikimediaCountry) {
      toast.error('Please select a country');
      return;
    }

    setSavingCountry(true);
    try {
      // On success the user gets a country, and the effect above redirects to the app
      await updateUser({ country: wikimediaCountry });
    } finally {
      setSavingCountry(false);
    }
  };

  // Returning from Wikimedia: still loading the user
  if (wikimediaStatus === 'success' && authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Finishing your Wikimedia login...
        </div>
      </div>
    );
  }

  // First Wikimedia login: pick a country before entering the app
  if (wikimediaStatus === 'success' && user && !user.country) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>One more step</CardTitle>
              <CardDescription>
                You are signed in as {user.wikimediaUsername || user.username}. Choose your country to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveWikimediaCountry} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wikimedia-country">Country</Label>
                  <Select value={wikimediaCountry} onValueChange={setWikimediaCountry}>
                    <SelectTrigger id="wikimedia-country">
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

                <Button type="submit" className="w-full" disabled={savingCountry}>
                  {savingCountry ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={loginWithWikimedia}
                  disabled={loading}
                >
                  Log in with Wikimedia
                </Button>
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