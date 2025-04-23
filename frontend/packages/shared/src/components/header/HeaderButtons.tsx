import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type UpdateInfo = {
  available: boolean;
  version: string;
  features: string[];
};

export function HeaderButtons() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    version: '1.2.0',
    features: ['Improved account security', 'Faster loading times', 'New payment options'],
  });

  const [helpOpen, setHelpOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  // Simulate checking for updates
  useEffect(() => {
    // This would normally be an API call to check for updates
    const checkForUpdates = () => {
      // Simulate an update being available (for demo purposes)
      // eslint-disable-next-line react-web-api/no-leaked-timeout
      setTimeout(() => {
        setUpdateInfo({
          available: true,
          version: '1.2.0',
          features: ['Improved account security', 'Faster loading times', 'New payment options'],
        });
      }, 3000);
    };

    checkForUpdates();
  }, []);

  const handleStartUpdate = () => {
    setUpdateDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {updateInfo.available && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setUpdateDialogOpen(true)}
                  className="relative p-2 rounded-full hover:bg-[#1F1F23] transition-colors duration-200 text-blue-400 group"
                >
                  <Download className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                  <span className="sr-only">Update Available</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#1F1F23] border-[#2B2B30] text-gray-200">
                <p>
                  Update v
                  {updateInfo.version}
                  {' '}
                  available
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 rounded-full hover:bg-[#1F1F23] transition-colors duration-200 text-gray-300"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#1F1F23] border-[#2B2B30] text-gray-200">
              <p>Help & FAQ</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Update Dialog */}
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

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="bg-[#0F0F12] border-[#1F1F23] text-gray-200 sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">Help & FAQ</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Getting Started</h3>
                <p className="text-gray-400">
                  Welcome to Nexus. This application allows you to rent accounts
                  for a specific duration using coins.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">How to Use</h3>
                <ol className="space-y-2 text-gray-400 list-decimal pl-5">
                  <li>Browse available accounts in the Accounts section</li>
                  <li>Select an account that matches your requirements</li>
                  <li>Choose a rental duration and confirm using your coins</li>
                  <li>Log in into the account and use it by the chosen duration</li>
                  <li>Return or extend the rental when needed</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Account Types</h3>
                <p className="text-gray-400">
                  We offer various account types based on rank, champion count, and skin availability.
                </p>
                <ul className="space-y-2 text-gray-400 list-disc pl-5">
                  <li>
                    <span className="text-white">Ranked Accounts:</span>
                    {' '}
                    Accounts with verified ranks from Iron to
                    Challenger
                  </li>
                  <li>
                    <span className="text-white">Champion Collections:</span>
                    {' '}
                    Accounts with specific champion pools
                  </li>
                  <li>
                    <span className="text-white">Skin Collections:</span>
                    {' '}
                    Accounts with rare or multiple skins
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Account Security</h3>
                <p className="text-gray-400">
                  All accounts are verified and secured. We guarantee account stability during your rental period.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="coins" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">How Coins Work</h3>
                <p className="text-gray-400">Coins are the currency used within our application to rent accounts.</p>
                <ul className="space-y-2 text-gray-400 list-disc pl-5">
                  <li>Purchase coins through the Coins section</li>
                  <li>Different account types and durations cost different amounts of coins</li>
                  <li>Higher ranked accounts or accounts with more champions/skins cost more coins</li>
                  <li>Longer rental durations provide better value per coin</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Rental Duration</h3>
                <p className="text-gray-400">You can rent accounts for various durations:</p>
                <ul className="space-y-2 text-gray-400 list-disc pl-5">
                  <li>1 hour: Quick gaming sessions</li>
                  <li>3 hours: Extended play time</li>
                  <li>6 hours: Half-day rental</li>
                  <li>12 hours: Full-day rental</li>
                  <li>24 hours: Day-long access</li>
                </ul>
                <p className="text-gray-400 mt-2">You can extend your rental at any time by paying additional coins.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Refunds</h3>
                <p className="text-gray-400">
                  If you return an account before the rental period ends, you'll receive a partial refund of coins based
                  on the unused time.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button onClick={() => setHelpOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
