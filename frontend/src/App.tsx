import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Providers from './providers';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/bottom-nav';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import F1Page from '@/pages/F1Page';
import FinancePage from '@/pages/FinancePage';
import GamingPage from '@/pages/GamingPage';
import MediaPage from '@/pages/MediaPage';
import NotesPage from '@/pages/NotesPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ReadingPage from '@/pages/ReadingPage';
import BookDetailPage from '@/pages/BookDetailPage';
import SportsPage from '@/pages/SportsPage';
import SportsFavoritesPage from '@/pages/SportsFavoritesPage';
import TravelPage from '@/pages/TravelPage';
import TripDetailPage from '@/pages/TripDetailPage';

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <div className="bg-[#09090b] text-white min-h-screen pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/f1" element={<F1Page />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/gaming" element={<GamingPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/reading" element={<ReadingPage />} />
              <Route path="/reading/:id" element={<BookDetailPage />} />
              <Route path="/sports" element={<SportsPage />} />
              <Route path="/sports/favoritos" element={<SportsFavoritesPage />} />
              <Route path="/travel" element={<TravelPage />} />
              <Route path="/travel/:id" element={<TripDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
          </ProtectedRoute>
          <Toaster theme="dark" richColors position="top-right" />
        </div>
      </BrowserRouter>
    </Providers>
  );
}
