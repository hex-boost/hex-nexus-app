import UpdateOverlay from '@/components/update-animation/update-overlay.tsx';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  // const [isMaximized, setIsMaximized] = useState(false);
  const [_, setShowDemo] = useState(false);

  return (
  // <div
  //   className={`flex flex-col h-screen bg-[#0F0F12] text-white ${isMaximized ? 'w-screen' : 'w-[1024px] mx-auto'}`}
  // >
  //
  //   <Button onClick={() => setShowDemo(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
  //     Demo Update Animation
  //   </Button>

    <UpdateOverlay isVisible onComplete={() => setShowDemo(false)} simulateUpdate />
    // </div>
  );
}
