import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import DashboardPage from './pages/DashboardPage';
import GuestsPage from './pages/GuestsPage';
import SeatingPage from './pages/SeatingPage';
import RoomLayoutPage from './pages/RoomLayoutPage';
import CheckInPage from './pages/CheckInPage';
import ImportsPage from './pages/ImportsPage';
import ExportsPage from './pages/ExportsPage';
import AdminPage from './pages/AdminPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/events" />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:eventId/dashboard" element={<DashboardPage />} />
                <Route path="/events/:eventId/guests" element={<GuestsPage />} />
                <Route path="/events/:eventId/seating" element={<SeatingPage />} />
                <Route path="/events/:eventId/room-layout" element={<RoomLayoutPage />} />
                <Route path="/events/:eventId/check-in" element={<CheckInPage />} />
                <Route path="/events/:eventId/imports" element={<ImportsPage />} />
                <Route path="/events/:eventId/exports" element={<ExportsPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
