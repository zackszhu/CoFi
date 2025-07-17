"use client";

import { useSession } from "next-auth/react";
import { useState, FormEvent } from "react";

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    if (!currentPin || !newPin || !confirmNewPin) {
      setError("All PIN fields are required.");
      setIsSubmitting(false);
      return;
    }

    if (newPin !== confirmNewPin) {
      setError("New PIN and confirmation PIN do not match.");
      setIsSubmitting(false);
      return;
    }

    if (newPin.length < 4) { // Basic PIN length validation
      setError("New PIN must be at least 4 digits long.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/user/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change PIN.');
      }

      setSuccessMessage(result.message || 'PIN changed successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6 text-center">User Management</h1>
      {session?.user?.name ? (
        <p className="mb-6 text-center text-gray-700">Manage your user settings here, {session.user.name}.</p>
      ) : (
        <p className="mb-6 text-center text-gray-700">Manage your user settings here.</p>
      )}

      {session ? (
        <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Change Your PIN</h2>
          
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          {successMessage && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

          <div>
            <label htmlFor="currentPin" className="block text-sm font-medium text-gray-700">Current PIN</label>
            <input
              type="password"
              id="currentPin"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              autoComplete="current-password" // Helps password managers
            />
          </div>

          <div>
            <label htmlFor="newPin" className="block text-sm font-medium text-gray-700">New PIN</label>
            <input
              type="password"
              id="newPin"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmNewPin" className="block text-sm font-medium text-gray-700">Confirm New PIN</label>
            <input
              type="password"
              id="confirmNewPin"
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Changing PIN...' : 'Change PIN'}
          </button>
        </form>
      ) : (
        <p className="text-center text-gray-600">Please log in to manage your settings.</p>
      )}
    </div>
  );
}
