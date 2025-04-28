import { LoginForm } from '@/components/login-form.tsx';
import { useCommonFetch } from '@/hooks/useCommonFetch';
import { useProfileAvatar } from '@/hooks/useProfileAvatar';
import { userAuth } from '@/lib/strapi';
import { useUserStore } from '@/stores/useUserStore';
import { Discord } from '@discord';
import { HWID } from '@hwid';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

export function LoginFormPage() {
  const { refetchUser } = useCommonFetch();
  const router = useRouter();
  const { getDefaultBase64Avatar, uploadImageFromBase64 } = useProfileAvatar();
  const { setAuthToken } = useUserStore();

  const loginMutation = useMutation({
    mutationFn: async (params: { identifier: string; password: string }) => {
      return await userAuth.login(params);
    },
    onSuccess: async (data) => {
      if (import.meta.env.MODE !== 'development') {
        const currentHwid = await HWID.Get();
        if (data.user.hwid && data.user.hwid !== currentHwid) {
          setAuthToken(''); // Clear token
          toast.error('Login failed: Hardware ID mismatch');
          return;
        }
      }

      setAuthToken(data.jwt);
      await refetchUser();
      router.navigate({ to: '/dashboard' });
    },
    onError: (error) => {
      // @ts-expect-error ts is dumb
      toast.error(`${error.error.message}`);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (params: { email: string; username: string; password: string }) => {
      const base64Avatar = await getDefaultBase64Avatar(params.username);
      const uploadedAvatar = await uploadImageFromBase64(base64Avatar);
      const registerPayload = {
        username: params.username,
        email: params.email,
        password: params.password,
        avatar: uploadedAvatar.data[0].id,
        hwid: await HWID.Get(),
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
  });

  const discordLoginMutation = useMutation({
    mutationFn: async () => {
      return Discord.StartOAuth();
    },
    onSuccess: async (data) => {
      console.info('discord login data', data);
      if (!data || !data.jwt) {
        toast.error('Failed to authenticate with Discord');
        return;
      }

      console.info('discord login jwt', data?.jwt);
      setAuthToken(data.jwt);

      try {
        await refetchUser();
        console.info('User refetched successfully');
        router.navigate({ to: '/dashboard' });
      } catch (error) {
        console.error('Error refetching user:', error);
        toast.error('Failed to load user data');
      }
    },
    onError: (error) => {
      console.error('Error in Discord login:', error);
      toast.error('Failed to authenticate with Discord');
    },
  });

  const handleLogin = async (identifier: string, password: string) => {
    await loginMutation.mutateAsync({ identifier, password });
  };

  const handleRegister = async (email: string, username: string, password: string) => {
    await registerMutation.mutateAsync({ email, username, password });
  };

  const handleDiscordLogin = async () => {
    await discordLoginMutation.mutateAsync();
  };

  return (
    <LoginForm
      onLogin={handleLogin}
      onRegister={handleRegister}
      onDiscordLogin={handleDiscordLogin}
      isLoginLoading={loginMutation.isPending}
      isRegisterLoading={registerMutation.isPending}
      isDiscordLoading={discordLoginMutation.isPending}
    />
  );
}
