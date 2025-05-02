// frontend/packages/shared/src/components/BoostRoyalOrderModal.tsx
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type BoostRoyalOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderId: number) => void;
  isLoading: boolean;
};

export function BoostRoyalOrderModal({ isOpen, onClose, onSubmit, isLoading }: BoostRoyalOrderModalProps) {
  const [orderId, setOrderId] = useState<string>('');

  const handleSubmit = () => {
    const orderIdNumber = Number.parseInt(orderId, 10);
    if (!Number.isNaN(orderIdNumber) && orderIdNumber > 0) {
      onSubmit(orderIdNumber);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>BoostRoyal Order Verification</DialogTitle>
          <DialogDescription>
            Enter your BoostRoyal order ID to rent this account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="order-id">Order ID</Label>
            <Input
              id="order-id"
              placeholder="Enter your BoostRoyal order ID"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              type="number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!orderId || isLoading}
            loading={isLoading}
          >
            Verify & Rent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
