import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { useUpdate } from '@/hooks/useUpdate/useUpdate.tsx';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { cls } from 'react-image-crop';

export function UpdateDialog() {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const { updateInfo, isAvailable, handleStartUpdate } = useUpdate();
  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => isAvailable && setUpdateDialogOpen(true)}
              className={cls('relative p-2 rounded-full hover:bg-[#1F1F23] transition-colors duration-200 group', isAvailable && 'text-blue-400')}
            >
              <Download className="h-5 w-5" />
              {
                isAvailable
                && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              }
              <span className="sr-only">Update Available</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1F1F23] border-[#2B2B30] text-gray-200">
            <p>
              {
                isAvailable
                  ? (
                      <>
                        Update
                        {updateInfo.version}
                        {' '}
                        available
                      </>
                    )
                  : (
                      <>
                        No updates available
                      </>
                    )
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="bg-[#0F0F12] border-[#1F1F23] text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Update Available</DialogTitle>
            <DialogDescription className="text-gray-400">
              Version
              {' '}
              {updateInfo.version}
              {' '}
              is now available for download
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              className="border-[#2B2B30] text-gray-300 hover:bg-[#1F1F23] hover:text-white"
            >
              Later
            </Button>
            <Button onClick={handleStartUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
              Update Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
