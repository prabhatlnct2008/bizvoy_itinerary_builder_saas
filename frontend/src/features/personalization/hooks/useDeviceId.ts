import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Custom hook for browser fingerprinting
 * Uses FingerprintJS to generate a unique device identifier
 */
export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const generateDeviceId = async () => {
      try {
        setLoading(true);

        // Load FingerprintJS
        const fp = await FingerprintJS.load();

        // Get the visitor identifier
        const result = await fp.get();

        // Set the device ID
        setDeviceId(result.visitorId);
        setError(null);
      } catch (err) {
        console.error('Error generating device ID:', err);
        setError(err as Error);

        // Fallback: generate a random ID if fingerprinting fails
        const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        setDeviceId(fallbackId);
      } finally {
        setLoading(false);
      }
    };

    generateDeviceId();
  }, []);

  return { deviceId, loading, error };
};
