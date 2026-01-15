'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shader3 } from '@/components/shader3';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Shader background */}
      <Shader3 color="#ffffff" className="-z-10" />
      
      <div className="relative z-10 w-full max-w-md space-y-8 px-4">
        <div className="rounded-xl border bg-background/80 backdrop-blur-sm p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a verification link to
            </p>
            {email && (
              <p className="mt-1 font-medium">{decodeURIComponent(email)}</p>
            )}
          </div>

          <div className="mt-8 space-y-4">

            <Button asChild className="w-full">
              <Link href="/login">Go to Sign In</Link>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn't receive the email?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Try again
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
