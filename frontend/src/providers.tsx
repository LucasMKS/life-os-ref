import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minuto de cache padrão para navegação fluida sem refetches contínuos
            gcTime: 1000 * 60 * 10, // 10 minutos de retenção em memória
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const userId = useAuthStore((state) => state.userId);

  // Limpa todo o cache do React Query quando o usuário muda ou desloga
  useEffect(() => {
    queryClient.clear();
  }, [userId, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
