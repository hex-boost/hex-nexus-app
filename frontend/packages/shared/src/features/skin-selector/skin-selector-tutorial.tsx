import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';

export function SkinSelectorTutorial({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const steps = [
    {
      title: 'Pre-select Your Favorite Skins',
      description: 'Browse through champions and select your favorite skins before until champion select ends. Your selections are saved automatically for future use.',
      icon: '🎮',
    },
    {
      title: 'Choose Before Lockout',
      description: 'Make sure to select your skin before the 10-second lockout period ends. After that, skin changes won\'t be applied.',
      icon: '⏱️',
    },
    {
      title: 'Automatic Application',
      description: 'When the game starts, your selected skin will be automatically applied to your champion - no need to select it every time!',
      icon: '✨',
    },
    {
      title: 'Important Requirement',
      description: 'You must have the base skin selected in the League client for the skin swapper to work properly.',
      icon: '⚠️',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="min-w-[720px]">
        <DialogHeader>
          <DialogTitle className="text-xl">How to Use Skin Selector</DialogTitle>
          <DialogDescription>
            Get the most out of the automatic skin selection feature
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">{step.icon}</span>
              </div>
              <div>
                <h3 className="font-medium text-sm">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="w-full">
            <Check className="mr-2 h-4 w-4" />
            {' '}
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
