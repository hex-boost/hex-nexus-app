// frontend/packages/shared/src/hooks/useDownloadLink.ts
import { useEffect, useState } from 'react';

export function useDownloadLink() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDownloadUrl() {
      try {
        setLoading(true);
        // First fetch latest version info
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/versions/latest`);

        if (!response.ok) {
          throw new Error('Failed to fetch version information');
        }

        const data = await response.json();
        const fileUrl = data.latestVersion.installer.url;
        const versionString = data.latestVersion.version;

        // Handle relative URLs
        const fullUrl = fileUrl.startsWith('/')
          ? `${import.meta.env.VITE_API_URL || ''}${fileUrl}`
          : fileUrl;

        setDownloadUrl(fullUrl);
        console.log('fetched url', fullUrl);
        setVersion(versionString);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch download link');
      } finally {
        setLoading(false);
      }
    }

    fetchDownloadUrl();
  }, []);

  return { downloadUrl, version, loading, error };
}
