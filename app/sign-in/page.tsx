'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Kulture
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
        <Button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          variant="outline"
          size="lg"
        >
          Continue with Google
        </Button>
      </div>
    </div>
  );
} 