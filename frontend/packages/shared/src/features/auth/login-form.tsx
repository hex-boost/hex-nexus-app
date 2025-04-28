import { DiscordSvg } from '@/assets/icons.tsx';
import hexNexusAuthBg from '@/assets/logo-hex-boost.svg';
import { FlickeringGrid } from '@/components/magicui/flickering-grid.tsx';
import Globe from '@/components/magicui/globe.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { WindowControls } from '@/components/WindowControls.tsx';
import { cn } from '@/lib/utils.ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';

// Types for props
export type LoginFormProps = {
  onLogin: (identifier: string, password: string) => Promise<void>;
  onRegister: (email: string, username: string, password: string) => Promise<void>;
  onDiscordLogin: () => Promise<void>;
  isLoginLoading?: boolean;
  isRegisterLoading?: boolean;
  isDiscordLoading?: boolean;
} & React.ComponentProps<'div'>;

export function LoginForm({
  className,
  onLogin,
  onRegister,
  onDiscordLogin,
  isLoginLoading = false,
  isRegisterLoading = false,
  isDiscordLoading = false,
  ...props
}: LoginFormProps) {
  const [activeTab, setActiveTab] = useState('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'login') {
      await onLogin(formData.email, formData.password);
    } else {
      await onRegister(formData.email, formData.username, formData.password);
    }
  };

  const isLoading = activeTab === 'login' ? isLoginLoading : isRegisterLoading;

  return (
    <>
      <WindowControls className="absolute w-screen top-0 right-0 px-4 py-2" />
      <div className="min-h-screen bg-background">
        <div className="w-full min-h-screen bg-background">
          <div className={cn('min-h-screen gap-6', className)} {...props}>
            <Card className="border-none rounded-none overflow-hidden w-full h-full">
              <CardContent className="grid w-full min-h-screen p-0 md:grid-cols-2">
                <div className="relative h-full hidden md:block">
                  <div className="absolute inset-0 flex items-start pt-6 h-full justify-center">
                    <div className="flex flex-col items-center p-8">
                      <img
                        src={hexNexusAuthBg}
                        alt="Hex Nexus Logo"
                        width={64}
                        height={64}
                        className="object-cover z-10 mb-4"
                      />
                      <h1 className="text-4xl font-bold mb-2">Nexus</h1>
                      <p className="text-base text-muted-foreground font-medium text-center mb-1">
                        The number one place to find your account
                        <br />
                        <strong className="font-medium text-white">Never waste your time</strong>
                        {' '}
                        searching for accounts again.
                      </p>
                    </div>
                    <FlickeringGrid
                      className="absolute h-full opacity-50 inset-0 z-0 w-screen pointer-events-none"
                      squareSize={4}
                      gridGap={12}
                      color="#4552B8"
                      maxOpacity={0.1}
                      flickerChance={0.1}
                    />
                    <Globe />
                  </div>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex justify-center w-full items-center p-6 md:p-8"
                  data-testid="auth-tabs"
                >
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6 justify-center max-w-[480px] w-full items-center"
                    data-testid="auth-form"
                  >
                    <TabsContent
                      key="login"
                      className="w-full flex flex-col gap-6"
                      value="login"
                    >
                      <div className="flex w-full flex-col items-center text-center">
                        <h1 className="text-2xl font-bold">Welcome back</h1>
                        <p className="text-balance text-muted-foreground">
                          Access your account to continue
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          autoComplete="email"
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          required
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          data-testid="login-email-input"
                        />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center">
                          <Label htmlFor="password">Password</Label>
                        </div>
                        <div className="relative">
                          <Input
                            placeholder="**********"
                            id="password"
                            autoComplete="current-password"
                            type={showLoginPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={e => setFormData({
                              ...formData,
                              password: e.target.value,
                            })}
                            data-testid="login-password-input"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            data-testid="login-password-toggle"
                          >
                            {showLoginPassword
                              ? (
                                  <EyeOff className="h-4 w-4" />
                                )
                              : (
                                  <Eye className="h-4 w-4" />
                                )}
                          </button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent key="register" className="w-full flex flex-col gap-6" value="register">
                      <div className="flex flex-col items-center text-center">
                        <h1 className="text-2xl font-bold">Create Account</h1>
                        <p className="text-balance text-muted-foreground">
                          Register to start your journey
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          placeholder="Your username"
                          autoComplete="username"
                          id="username"
                          required
                          value={formData.username}
                          onChange={e => setFormData({ ...formData, username: e.target.value })}
                          data-testid="register-username-input"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          className="!bg-background"
                          required
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          data-testid="register-email-input"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            placeholder="**********"
                            id="password"
                            type={showRegisterPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({
                              ...formData,
                              password: e.target.value,
                            })}
                            data-testid="register-password-input"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            data-testid="register-password-toggle"
                          >
                            {showRegisterPassword
                              ? (
                                  <EyeOff className="h-4 w-4" />
                                )
                              : (
                                  <Eye className="h-4 w-4" />
                                )}
                          </button>
                        </div>
                      </div>
                    </TabsContent>

                    <Button
                      loading={isLoading}
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="auth-submit-button"
                    >
                      {activeTab === 'login'
                        ? isLoginLoading ? 'Signing in...' : 'Sign in'
                        : isRegisterLoading ? 'Registering...' : 'Register'}
                    </Button>

                    <div className="flex items-center gap-4 w-full">
                      <Separator className="flex-1 w-full" />
                      <span className="text-muted-foreground text-xs">OR</span>
                      <Separator className="w-full flex-1" />
                    </div>

                    <Button
                      type="button"
                      disabled={isDiscordLoading}
                      loading={isDiscordLoading}
                      onClick={onDiscordLogin}
                      variant="outline"
                      className="w-full space-x-2"
                      data-testid="discord-login-button"
                    >
                      {!isDiscordLoading && <DiscordSvg />}
                      <p>Continue with Discord</p>
                    </Button>

                    <TabsList className="text-center text-sm">
                      <span>
                        {activeTab === 'login' ? 'Don\'t have an account? ' : 'Already have an account? '}
                      </span>
                      <TabsTrigger
                        value={activeTab === 'login' ? 'register' : 'login'}
                        className="underline underline-offset-4 cursor-pointer"
                        data-testid="auth-tab-toggle"
                      >
                        {activeTab === 'login' ? 'Sign up' : 'Log in'}
                      </TabsTrigger>
                    </TabsList>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
