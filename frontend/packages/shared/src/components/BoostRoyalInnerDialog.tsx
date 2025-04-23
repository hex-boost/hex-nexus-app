import {
  InnerDialog,
  InnerDialogContent,
  InnerDialogDescription,
  InnerDialogFooter,
  InnerDialogHeader,
  InnerDialogTitle,
  InnerDialogTrigger,
} from '@/components/ui/nested-dialog.tsx';
import * as React from 'react';

export function BoostRoyalInnerDialog({ children }: { children: React.ReactNode }) {
  return (
    <InnerDialog>
      <InnerDialogTrigger asChild>
        {children}
      </InnerDialogTrigger>
      <InnerDialogContent className="p-0">
        <InnerDialogHeader className="border-b p-4">
          <InnerDialogTitle>BR Balance Payment</InnerDialogTitle>
          <InnerDialogDescription>
            Follow the steps to pay from your BR account successfully
          </InnerDialogDescription>
        </InnerDialogHeader>
        <div className="p-4">

          lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus.

        </div>
        <InnerDialogFooter className="flex flex-col items-center justify-between space-y-2 border-t px-4 py-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus.
          {/* Add BR Balance specific footer content here */}
        </InnerDialogFooter>
      </InnerDialogContent>
    </InnerDialog>
  );
}
