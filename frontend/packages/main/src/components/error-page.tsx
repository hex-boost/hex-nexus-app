import { Button } from '@/components/ui/button';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { AlertCircle, Home, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

type ErrorPageProps = {
  error?: Error | string;
};

export function ErrorPage({ error }: ErrorPageProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>('An unexpected error occurred');
  const [isAnimating, setIsAnimating] = useState(true);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (error) {
      if (typeof error === 'string') {
        setErrorMessage(error);
      } else {
        setErrorMessage(error.message || 'We encountered a problem while processing your request');
      }
    } else {
      setErrorMessage('We encountered a problem while processing your request');
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-background">
      <div className="w-full max-w-md mx-auto text-center space-y-8">
        <div className="flex justify-center">
          <div className={`rounded-full bg-red-100 dark:bg-red-900/30 p-5 ${isAnimating ? 'animate-pulse' : ''}`}>
            <AlertCircle
              size={60}
              className={`text-red-600 dark:text-red-400 ${isAnimating ? 'animate-bounce' : ''}`}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Oops, something went wrong!
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {errorMessage}
          </p>

          {isDevelopment && error instanceof Error && error.stack && (
            <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-md text-left overflow-y-auto">
              <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {error.stack}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.invalidate()}
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
