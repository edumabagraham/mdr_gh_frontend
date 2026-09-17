'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) return <p className="p-8">Loading…</p>;

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl">Welcome, {user?.name}</h1>
      <p className="text-gray-500">{user?.email}</p>
      <button
        onClick={handleLogout}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Log out
      </button>
    </div>
  );
}