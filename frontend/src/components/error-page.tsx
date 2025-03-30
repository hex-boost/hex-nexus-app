import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, Home, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ErrorPage() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>('An unexpected error occurred');
  const [isAnimating, setIsAnimating] = useState(true);

  // Reset animation when component renders
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Set error message
  useEffect(() => {
    setErrorMessage('We encountered a problem while processing your request');
  }, []);

  return (

    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-background">

      <div className="w-full max-w-md mx-auto text-center space-y-8">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className={`rounded-full bg-red-100 dark:bg-red-900/30 p-5 ${isAnimating ? 'animate-pulse' : ''}`}>
            <AlertCircle
              size={60}
              className={`text-red-600 dark:text-red-400 ${isAnimating ? 'animate-bounce' : ''}`}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Oops, something went wrong!
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {errorMessage}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw size={16} />
            Try again
          </Button>

          <Button
            onClick={() => navigate({ to: '/' })}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Home size={16} />
            Go to home
          </Button>
        </div>
      </div>
    </div>
  );
}
