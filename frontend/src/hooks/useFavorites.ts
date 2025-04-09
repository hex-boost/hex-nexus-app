import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type AddFavoriteParams = {
  note?: string;
  riotAccountId: number;
};

type UpdateFavoriteNoteParams = {
  favoriteId: number;
  note: string;
};

export function useFavorites() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  // Add favorite account
  const addFavorite = useMutation({
    mutationFn: async ({ riotAccountId }: AddFavoriteParams) => {
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      toast.loading('Adding to favorites...');
      return await strapiClient.request('post', 'favorites', {
        data: {
          user: user.id.toString(),
          riot_account: riotAccountId,
        },
      });
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success('Account added to favorites');
      // Refetch user data to update the UI
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error('Failed to add favorite', {
        description: error.message,
      });
    },
  });

  // Update favorite note
  const updateFavoriteNote = useMutation({
    mutationFn: async ({ favoriteId, note }: UpdateFavoriteNoteParams) => {
      toast.loading('Saving note...');
      const response = await strapiClient.request('put', `favorites/${favoriteId}`, {
        data: {
          note,
        },
      });
      return response;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success('Note saved');
      // Refetch user data to update the UI
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error('Failed to save note', {
        description: error.message,
      });
    },
  });

  // Remove favorite
  const removeFavorite = useMutation({
    mutationFn: async (favoriteId: number) => {
      toast.loading('Removing from favorites...');
      const response = await strapiClient.request('delete', `favorites/${favoriteId}`);
      return response;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success('Account removed from favorites');
      // Refetch user data to update the UI
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error('Failed to remove favorite', {
        description: error.message,
      });
    },
  });

  return {
    addFavorite,
    updateFavoriteNote,
    removeFavorite,
  };
}
