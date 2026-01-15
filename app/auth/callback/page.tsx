'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (accessToken && type === 'signup') {
      setStatus('success');
      setTimeout(() => router.push('/login'), 2000);
    } else if (accessToken) {
      setStatus('success');
      setTimeout(() => router.push('/login'), 2000);
    } else {
      setStatus('error');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Verifying...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Signed Up Successfully!</h2>
            <p className="text-muted-foreground">Your account has been verified. Redirecting to sign in...</p>
            <Button asChild className="w-full">
              <Link href="/login">Go to Sign In</Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <svg className="h-8 w-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Verification Failed</h2>
            <p className="text-muted-foreground">Something went wrong. Please try again.</p>
            <Button asChild className="w-full">
              <Link href="/register">Try Again</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
