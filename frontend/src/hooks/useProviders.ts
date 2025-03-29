import { providerAuth, strapiClient } from '@/lib/strapi';
import { useUserStore } from '@/stores/useUserStore';

export async function authenticateProviders(access_token: string) {
  try {
    const { user, jwt } = await providerAuth.authenticateProvider('discord', access_token);
    let avatarUrl: string;

    // Substituição de cookie por localStorage
    localStorage.setItem('authToken', access_token);

    const userDiscord = await providerAuth.getUserInfo(access_token);
    avatarUrl = `https://cdn.discordapp.com/avatars/${userDiscord.id}/${userDiscord.avatar}.png`;

    // Substituição de cookie por localStorage
    localStorage.removeItem('authToken');

    await strapiClient.uploadImage(avatarUrl, user.id);
    localStorage.setItem('authToken', jwt);
    const updatedUser = strapiClient.axios.get('/api/users/me');
    useUserStore().login(updatedUser, jwt);
  } catch (error) {
    // Limpeza de tokens em caso de erro
    localStorage.removeItem('authToken');
  }
}
