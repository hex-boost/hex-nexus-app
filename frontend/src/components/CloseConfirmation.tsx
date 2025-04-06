import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGoFunctions } from '@/hooks/useGoBindings.ts';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

export function CloseConfirmationHandler() {
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const { Utils } = useGoFunctions();
  useEffect(() => {
    // Listen for close confirmation requests
    const cancel = Events.On('nexus:confirm-close', () => {
      setShowCloseDialog(true);
    });

    return () => {
      cancel();
    };
  }, []);

  return (
    <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Close</DialogTitle>
          <DialogDescription>We notice you're with a nexus account in using, close the app will close and logout you as well</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => Utils.ForceCloseAndQuit()}>Close Nexus</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add this component to your RootLayout component
