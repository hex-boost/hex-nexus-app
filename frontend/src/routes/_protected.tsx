import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useFavoriteAccounts } from '@/hooks/useFavoriteAccounts.ts';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Events } from '@wailsio/runtime';

export const Route = createFileRoute('/_protected')({
  component: DashboardLayout,
});

function DashboardLayout() {
  Events.On(Events.Types.Windows.WindowClosing, async (ev) => {
    console.log(ev);
  });
  const { updateFavoriteNote, isNoteDialogOpen, setIsNoteDialogOpen, noteText, setNoteText, handleSaveNote } = useFavoriteAccounts();
  return (
    <>

      <AdminPanelLayout>

        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{noteText ? 'Edit Note' : 'Add Note'}</DialogTitle>
              <DialogDescription>
                Add a personal note about this account to help you remember important details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Enter your note here..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="min-h-[100px] resize-none "
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNoteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveNote} disabled={updateFavoriteNote.isPending}>
                {updateFavoriteNote.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="p-6 ">
          <Outlet />
        </div>
      </AdminPanelLayout>

    </>
  );
}
