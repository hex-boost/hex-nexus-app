import hexNexusAuthBg from '@/assets/logo-hex-boost.svg';
import { FlickeringGrid } from '@/components/magicui/flickering-grid.tsx';
import Globe from '@/components/magicui/globe.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCommonFetch } from '@/hooks/useCommonFetch.ts';
import { useGoFunctions } from '@/hooks/useGoBindings.ts';
import { useProfileAvatar } from '@/hooks/useProfileAvatar.ts';
import { userAuth } from '@/lib/strapi';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function DiscordSvg() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 -28.5 256 256"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      preserveAspectRatio="xMidYMid"
      fill="#000000"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <g>
          <path
            d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
            fill="#ffffff"
            fillRule="nonzero"
          />
        </g>
      </g>
    </svg>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { Utils } = useGoFunctions();
  const { refetchUser } = useCommonFetch();
  const router = useRouter();
  const { getDefaultBase64Avatar, uploadImageFromBase64 } = useProfileAvatar();
  const [activeTab, setActiveTab] = useState('login');
  const { setAuthToken } = useUserStore();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const loginMutation = useMutation(
    {
      mutationFn: async () => {
        return await userAuth.login({
          identifier: formData.email,
          password: formData.password,
        });
      },
      onSuccess: async (data) => {
        setAuthToken(data.jwt);
        if (import.meta.env.API_URL !== 'http://localhost:1337') {
          const currentHwid = await Utils.GetHWID();
          if (data.user.hwid && data.user.hwid !== currentHwid) {
            setAuthToken(''); // Clear token
            toast.error('Login failed: Hardware ID mismatch');
            return;
          }
        }

        await refetchUser();
        router.navigate({ to: '/dashboard' });
      },
      onError: (error) => {
        // @ts-expect-error ts is dumb
        toast.error(`${error.error.message}`);
      },
    },
  );
  const registerMutation = useMutation(
    {
      mutationFn:
        async () => {
          const base64Avatar = await getDefaultBase64Avatar(formData.username);
          const uploadedAvatar = await uploadImageFromBase64(base64Avatar);
          const registerPayload = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            avatar: uploadedAvatar.data[0].id,
            hwid: await Utils.GetHWID(),
          } as any;
          return await userAuth.register(registerPayload);
        },
      onSuccess: async (data) => {
        setAuthToken(data.jwt);
        await refetchUser();

        router.navigate({ to: '/dashboard' });
      },
      onError: (error) => {
        // @ts-expect-error ts is dumb
        toast.error(`${error.error.message}`);
      },
    },
  );
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'login') {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  const isLoading = activeTab === 'login' ? loginMutation.isPending : registerMutation.isPending;
  return (

    <div className="flex h-screen w-screen   bg-background">
      <div className="w-full h-full  bg-background ">
        <div
          className={cn('flex justify-center h-full items-center  flex-col gap-6', className)}
          {...props}
        >
          <Card className="border-none rounded-none overflow-hidden w-full h-full">
            <CardContent className="grid  w-full h-full p-0 md:grid-cols-2">
              <div className="relative h-full hidden  md:block">
                <div className="absolute inset-0  flex items-start pt-6 h-full justify-center">
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
                    gridGap={6}
                    color="#4552B8"
                    maxOpacity={0.2}
                    flickerChance={0.1}
                  />
                  <Globe />
                </div>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex justify-center w-full items-center p-6 md:p-8"
              >
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6 justify-center max-w-[480px] w-full items-center"
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
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  <Button loading={isLoading} type="submit" className="w-full" disabled={isLoading}>
                    {activeTab === 'login'
                      ? isLoading ? 'Signing in...' : 'Sign in'
                      : isLoading ? 'Registering...' : 'Register'}
                  </Button>
                  <TabsList className="text-center text-sm">
                    <span>
                      {activeTab === 'login' ? 'Don\'t have an account? ' : 'Already have an account? '}
                    </span>
                    <TabsTrigger
                      value={activeTab === 'login' ? 'register' : 'login'}
                      className="underline underline-offset-4 cursor-pointer"
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
  );
}
