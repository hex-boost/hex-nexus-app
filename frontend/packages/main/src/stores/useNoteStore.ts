import { create } from 'zustand/index';

// export const useUserStore = create<AuthState>((set, get) => ({
type NoteStoreType = {
  isNoteDialogOpen: boolean;
  setIsNoteDialogOpen: (isOpen: boolean) => void;
  noteText: string;
  setNoteText: (text: string) => void;
  favoriteAccountId: string;
  setFavoriteAccountId: (id: string) => void;

};
export const useNoteStore = create<NoteStoreType>((set, _) => ({
  favoriteAccountId: '',
  setFavoriteAccountId: (id: string) => set({ favoriteAccountId: id }),
  isNoteDialogOpen: false,
  setIsNoteDialogOpen: (isOpen: boolean) => set({ isNoteDialogOpen: isOpen }),
  noteText: '',
  setNoteText: (text: string) => set({ noteText: text }),

}));
