import type { AccountType, FavoriteAccounts, UserType } from '@/types/types.ts';
import { logger } from '@/lib/logger.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useNoteStore } from '@/stores/useNoteStore.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type AddFavoriteParams = {
  account: AccountType;
};

type UpdateFavoriteNoteParams = {
  favoriteId: string;
  note: string;
  silent?: boolean;
};

export function useFavoriteAccounts() {
  const { setIsNoteDialogOpen, setNoteText, noteText, isNoteDialogOpen, setFavoriteAccountId, favoriteAccountId } = useNoteStore();
  const queryClient = useQueryClient();
  const { user, setUser } = useUserStore();

  // Helper function to get current user data from cache
  const getCurrentUserData = (): UserType | undefined => {
    return queryClient.getQueryData<UserType>(['users', 'me']);
  };

  // Helper to update both cache and store with the same user data
  const updateUserData = (userData: UserType) => {
    queryClient.setQueryData(['users', 'me'], userData);
    setUser(userData);
  };

  const handleEditNote = (account: AccountType) => {
    const favorite = user?.favoriteAccounts?.find(fav => fav.riot_account.id === account.id);
    if (favorite) {
      setNoteText(favorite.note || '');
      setFavoriteAccountId(favorite.documentId);
      setIsNoteDialogOpen(true);
    }
  };

  // Add favorite account
  const addFavorite = useMutation({
    mutationFn: async ({ account }: AddFavoriteParams) => {
      if (!user?.id) {
        throw new Error('User not logged in');
      }
      return await strapiClient.create('favorite-accounts', {
        data: {
          user: user.id,
          riot_account: account.id,
        },
      });
    },
    onMutate: async ({ account }: AddFavoriteParams) => {
      await queryClient.cancelQueries({ queryKey: ['users', 'me'] });
      const previousUser = getCurrentUserData();

      if (previousUser && account) {
        const optimisticFavorite = {
          documentId: `temp_${Date.now()}`,
          id: `temp_${Date.now()}`,
          user: previousUser.id,
          riot_account: account,
          note: '',
        };

        const updatedUser: any = {
          ...previousUser,
          favoriteAccounts: [
            optimisticFavorite,
            ...(previousUser.favoriteAccounts || []),
          ],
        };
        updateUserData(updatedUser);
      }
      return { previousUser };
    },
    onSuccess: (_) => {
      // Keep the optimistic update but also fetch the latest data
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
    onError: (error, _, context) => {
      logger.error('Add favorite failed:', error?.message);
      toast.error('Failed to add to favorites');
      if (context?.previousUser) {
        updateUserData(context.previousUser);
      }
    },
  });

  // Update favorite note
  const updateFavoriteNote = useMutation({
    mutationFn: async ({ favoriteId, note }: UpdateFavoriteNoteParams) => {
      return await strapiClient.update('favorite-accounts', favoriteId, { note });
    },
    onMutate: async ({ favoriteId, note }: UpdateFavoriteNoteParams) => {
      await queryClient.cancelQueries({ queryKey: ['users', 'me'] });
      const previousUser = getCurrentUserData();

      if (previousUser) {
        const updatedUser = {
          ...previousUser,
          favoriteAccounts: previousUser.favoriteAccounts?.map(fav =>
            fav.documentId === favoriteId ? { ...fav, note } : fav,
          ),
        };
        updateUserData(updatedUser);
      }
      return { previousUser };
    },
    onSuccess: (_, variables) => {
      if (!variables.silent) {
        toast.success('Note saved');
      }
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
    onError: (error, variables, context) => {
      logger.error('Update note failed:', error?.message);
      if (!variables.silent) {
        toast.error('Failed to save note');
      }
      if (context?.previousUser) {
        updateUserData(context.previousUser);
      }
    },
  });

  const handleSaveNote = async () => {
    if (favoriteAccountId) {
      await updateFavoriteNote.mutateAsync({
        favoriteId: favoriteAccountId,
        note: noteText,
      });
      setIsNoteDialogOpen(false);
      setFavoriteAccountId('');
      setNoteText('');
    }
  };

  // Remove favorite
  const removeFavorite = useMutation({
    mutationFn: async (favoriteDocumentId: string) => {
      return await strapiClient.delete(`favorite-accounts`, favoriteDocumentId);
    },
    onMutate: async (favoriteDocumentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['users', 'me'] });
      const previousUser = getCurrentUserData();

      if (previousUser) {
        const updatedUser = {
          ...previousUser,
          favoriteAccounts: previousUser.favoriteAccounts?.filter(
            fav => fav.documentId !== favoriteDocumentId,
          ),
        };
        updateUserData(updatedUser);
      }
      return { previousUser };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
    onError: (error, _, context) => {
      logger.error('Remove favorite failed:', error?.message);
      toast.error('Failed to remove from favorites');
      if (context?.previousUser) {
        updateUserData(context.previousUser);
      }
    },
  });

  const handleDeleteNote = async (account: AccountType) => {
    const favorite = user?.favoriteAccounts?.find(fav => fav.riot_account.id === account.id);
    if (favorite?.documentId) {
      // Optimistic update
      const currentUser = getCurrentUserData();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          favoriteAccounts: currentUser.favoriteAccounts?.map(fav =>
            fav.documentId === favorite.documentId ? { ...fav, note: '' } : fav,
          ),
        };
        updateUserData(updatedUser);
      }

      await updateFavoriteNote.mutateAsync({
        favoriteId: favorite.documentId,
        note: '',
        silent: false,
      });
    }
  };

  const handleRemoveFromFavorites = async (favoriteAccountId: string) => {
    await removeFavorite.mutateAsync(favoriteAccountId);
    setFavoriteAccountId(''); // Reset after removal
  };

  const handleAddToFavorites = async (riotAccount: AccountType) => {
    await addFavorite.mutate({ account: riotAccount });
  };

  function getFavoriteAccount(account: AccountType): FavoriteAccounts | undefined {
    return user?.favoriteAccounts?.find(fav => fav.riot_account.id === account.id);
  }

  return {
    getFavoriteAccount,
    handleRemoveFromFavorites,
    addFavorite,
    noteText,
    updateFavoriteNote,
    handleAddToFavorites,
    handleDeleteNote,
    handleSaveNote,
    removeFavorite,
    favoriteAccountId,
    isNoteDialogOpen,
    handleEditNote,
    setIsNoteDialogOpen,
    setNoteText,
    setFavoriteAccountId,
  };
}
