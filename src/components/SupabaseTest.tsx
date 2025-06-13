'use client';

import { useEffect, useState } from 'react';
import { testConnection } from '@/lib/supabase';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        const isConnected = await testConnection();
        setConnectionStatus(isConnected ? 'success' : 'error');
        if (!isConnected) {
          setErrorMessage('Failed to connect to Supabase');
        }
      } catch (error) {
        setConnectionStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }

    checkConnection();
  }, []);

  if (connectionStatus === 'loading') {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md shadow-md">
        Testing Supabase connection...
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 px-4 py-2 rounded-md shadow-md">
        Supabase connection failed: {errorMessage}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-md shadow-md">
      Supabase connected successfully
    </div>
  );
} 