import { PremiumContent } from '@/components/paywall/premium-content';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function PremiumContentDialog({
  title,
  description,
  ctaText,
  features,
  onAction,
  open,
  onOpenChange,
}: {
  features: string[];
  onAction: () => void;
  title: string;
  description: string;
  ctaText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none !max-w-2xl bg-transparent">
        <PremiumContent
          title={title}
          description={description}
          ctaText={ctaText}
          features={features}
          onAction={onAction}
        />
      </DialogContent>
    </Dialog>
  );
}
