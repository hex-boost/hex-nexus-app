import { Button } from '@/components/ui/button.tsx';
import UpdateOverlay from '@/components/update-animation/update-overlay.tsx';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div
      className={`flex flex-col h-screen bg-[#0F0F12] text-white ${isMaximized ? 'w-screen' : 'w-[1024px] mx-auto'}`}
    >

      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">League of Legends Account Rental</h1>
          <p className="text-gray-400 mb-8">This is a demo showing the Update and Help buttons functionality</p>
          <p className="text-gray-300 mb-6">
            Look for the
            {' '}
            <span className="text-blue-400">Update</span>
            {' '}
            and
            <span className="text-gray-300">Help</span>
            {' '}
            buttons in the top-right corner
          </p>

          <Button onClick={() => setShowDemo(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            Demo Update Animation
          </Button>
        </div>
      </div>

      {/* Demo Update Animation */}
      <UpdateOverlay isVisible={showDemo} onComplete={() => setShowDemo(false)} simulateUpdate />
    </div>
  );
}
