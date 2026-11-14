import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import {
  FormErrorAlert,
  PasswordChecklist,
  PasswordInput,
  applyServerErrors,
  focusFirstInvalid,
} from '../components/form-helpers';
import { useAuth } from '../lib/auth-context';
import { COUNTRIES } from '../lib/mock-data';
import {
  required,
  suggestEmail,
  validateCountry,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../lib/validation';

interface LoginValues {
  username: string;
  password: string;
}

interface RegisterValues {
  username: string;
  email: string;
  country: string;
  password: string;
}

const LOGIN_FIELDS = ['username', 'password'] as const;
const REGISTER_FIELDS = ['username', 'email', 'country', 'password'] as const;

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loginServerError, setLoginServerError] = useState<string | null>(null);
  const [registerServerError, setRegisterServerError] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    mode: 'onTouched',
    defaultValues: { username: '', password: '' },
  });

  const registerForm = useForm<RegisterValues>({
    mode: 'onTouched',
    defaultValues: { username: '', email: '', country: '', password: '' },
  });

  const watchedEmail = registerForm.watch('email');
  const watchedPassword = registerForm.watch('password');
  const emailSuggestion = suggestEmail(watchedEmail);

  const onLoginSubmit = async (values: LoginValues) => {
    setLoginServerError(null);
    const result = await login(values.username.trim(), values.password);
    if (result.success) {
      navigate('/');
      return;
    }

    const unplaced = applyServerErrors(loginForm, LOGIN_FIELDS, result);
    if (unplaced) {
      setLoginServerError(unplaced);
    }
  };

  const onRegisterSubmit = async (values: RegisterValues) => {
    setRegisterServerError(null);
    const result = await register(
      values.username.trim(),
      values.email.trim(),
      values.password,
      values.country
    );
    if (result.success) {
      navigate('/');
      return;
    }

    const unplaced = applyServerErrors(registerForm, REGISTER_FIELDS, result);
    if (unplaced) {
      if (/username already exists/i.test(unplaced)) {
        registerForm.setError('username', { type: 'server', message: unplaced });
      } else if (/email already exists/i.test(unplaced)) {
        registerForm.setError('email', { type: 'server', message: unplaced });
      } else {
        setRegisterServerError(unplaced);
      }
    }
  };

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
                <Form {...loginForm}>
                  <form
                    noValidate
                    onSubmit={loginForm.handleSubmit(onLoginSubmit, (_errors, e) =>
                      focusFirstInvalid(e)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      rules={{ validate: required('Username') }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Your username"
                              autoComplete="username"
                              {...field}
                              onChange={(e) => {
                                setLoginServerError(null);
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      rules={{ validate: required('Password') }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="Your password"
                              autoComplete="current-password"
                              {...field}
                              onChange={(e) => {
                                setLoginServerError(null);
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormErrorAlert message={loginServerError} />

                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Demo accounts:</strong>
                        <br />• WikiEditor2024 (Contributor)
                        <br />• SourceVerifier (Verifier)
                        <br />• AdminUser (Admin)
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginForm.formState.isSubmitting}
                    >
                      {loginForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </form>
                </Form>
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
                <Form {...registerForm}>
                  <form
                    noValidate
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit, (_errors, e) =>
                      focusFirstInvalid(e)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      rules={{ validate: validateUsername }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Choose a username"
                              autoComplete="username"
                              {...field}
                              onChange={(e) => {
                                setRegisterServerError(null);
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      rules={{ validate: validateEmail }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your.email@example.com"
                              autoComplete="email"
                              {...field}
                              onChange={(e) => {
                                setRegisterServerError(null);
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          {emailSuggestion && (
                            <p className="text-xs text-muted-foreground">
                              Did you mean{' '}
                              <button
                                type="button"
                                className="text-blue-600 hover:underline font-medium cursor-pointer"
                                onClick={() =>
                                  registerForm.setValue('email', emailSuggestion, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  })
                                }
                              >
                                {emailSuggestion}
                              </button>
                              ?
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="country"
                      rules={{ validate: validateCountry }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(val: string) => {
                              setRegisterServerError(null);
                              field.onChange(val);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.flag} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      rules={{ validate: validatePassword }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="Create a password"
                              autoComplete="new-password"
                              {...field}
                              onChange={(e) => {
                                setRegisterServerError(null);
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <PasswordChecklist password={watchedPassword} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormErrorAlert message={registerServerError} />

                    <div className="bg-amber-50 p-4 rounded-md">
                      <p className="text-sm text-amber-800">
                        By registering, you agree to help maintain Wikipedia's source quality standards.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerForm.formState.isSubmitting}
                    >
                      {registerForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
