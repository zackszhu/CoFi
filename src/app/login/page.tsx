"use client"; // This will be a client component to handle form state and submission

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // Import signIn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // For styling the form container

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      callbackUrl: '/dashboard', // Tell NextAuth where to go on success
      username,
      pin,
    });

    // If signIn is called with redirect: true (default) or a callbackUrl,
    // it will attempt to redirect, and this part might not be reached if successful.
    // If it does reach here and result.ok is false, there was an error.
    setIsLoading(false);
    if (result && !result.ok && result.error) {
      setError(result.error || 'Login failed. Please check your username and PIN.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h3 className="text-2xl font-bold leading-none tracking-tight">Login to CoFi</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                required
                placeholder="e.g., John or Jane"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN Code</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value)}
                required
                maxLength={4}
                placeholder="4-digit PIN"
                disabled={isLoading}
              />
            </div>
            {error && <div className="text-sm text-red-500 text-center">{error}</div>}
            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
