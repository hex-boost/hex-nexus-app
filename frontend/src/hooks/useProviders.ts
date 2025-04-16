import { providerAuth, strapiClient } from '@/lib/strapi';
import { useUserStore } from '@/stores/useUserStore';

export async function authenticateProviders(access_token: string) {
  try {
    const { login } = useUserStore();
    const { user, jwt } = await providerAuth.authenticateProvider('discord', access_token);

    localStorage.setItem('authToken', access_token);

    const userDiscord = await providerAuth.getUserInfo(access_token);
    const avatarUrl = `https://cdn.discordapp.com/avatars/${userDiscord.id}/${userDiscord.avatar}.png`;

    localStorage.removeItem('authToken');

    await strapiClient.uploadImage(avatarUrl, user.id);
    localStorage.setItem('authToken', jwt);
    const updatedUser = strapiClient.axios.get('/api/users/me');
    login(updatedUser, jwt);
  } catch (error) {
    localStorage.removeItem('authToken');
  }
}
