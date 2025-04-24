import { UpdateDialog } from '@/components/header/UpdateDialog.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

export function HeaderButtons() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">

        <UpdateDialog />
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 rounded-full hover:bg-shade7 transition-colors duration-200 text-muted-foreground"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="">
              <p>Help & FAQ</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="  sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">Help & FAQ</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Getting Started</h3>
                <p className="text-muted-foreground">
                  Welcome to Nexus. This application allows you to rent accounts
                  for a specific duration using coins.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">How to Use</h3>
                <ol className="space-y-2 text-muted-foreground list-decimal pl-5">
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
                <p className="text-muted-foreground">
                  We offer various account types based on rank, champion count, and skin availability.
                </p>
                <ul className="space-y-2 text-muted-foreground list-disc pl-5">
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
                <p className="text-muted-foreground">
                  All accounts are verified and secured. We guarantee account stability during your rental period.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="coins" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">How Coins Work</h3>
                <p className="text-muted-foreground">Coins are the currency used within our application to rent accounts.</p>
                <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                  <li>Purchase coins through the Coins section</li>
                  <li>Different account types and durations cost different amounts of coins</li>
                  <li>Higher ranked accounts or accounts with more champions/skins cost more coins</li>
                  <li>Longer rental durations provide better value per coin</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Rental Duration</h3>
                <p className="text-muted-foreground">You can rent accounts for various durations:</p>
                <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                  <li>1 hour: Quick gaming sessions</li>
                  <li>3 hours: Extended play time</li>
                  <li>6 hours: Half-day rental</li>
                  <li>12 hours: Full-day rental</li>
                  <li>24 hours: Day-long access</li>
                </ul>
                <p className="text-muted-foreground mt-2">You can extend your rental at any time by paying additional coins.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Refunds</h3>
                <p className="text-muted-foreground">
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
