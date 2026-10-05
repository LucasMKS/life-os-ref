'use client';

import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export function AuthButton() {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
    try {
      const userData = Cookies.get('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setNickname(user.nickname || user.name || null);
      }
    } catch {
      // cookie inválido, sem nickname
    }
  }, [token]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted) return null;

  if (token) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-[var(--color-f1-muted)]">
          <UserIcon size={16} />
          <span className="hidden md:inline">{nickname || 'LifeOS'}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-white rounded-md transition-colors"
        >
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-lg shadow-blue-500/20"
    >
      <LogIn size={16} />
      <span>Entrar</span>
    </button>
  );
}
