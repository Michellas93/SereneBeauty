import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import BookingFlow from './pages/BookingFlow';
import { AuthProvider } from './admin/context/AuthContext';
import { DataProvider } from './admin/context/DataContext';
import ProtectedRoute from './admin/components/ProtectedRoute';
import RoleRoute from './admin/components/RoleRoute';
import AdminLayout from './admin/components/AdminLayout';
import LoginPage from './admin/pages/LoginPage';
import SchedulePage from './admin/pages/SchedulePage';
import BookingsPage from './admin/pages/BookingsPage';
import RevenuePage from './admin/pages/RevenuePage';
import ManagePage from './admin/pages/ManagePage';
import AbsencesPage from './admin/pages/AbsencesPage';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<div className="mobile-shell"><Landing /></div>} />
            <Route path="/book" element={<div className="mobile-shell"><BookingFlow /></div>} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route index element={<Navigate to="schedule" replace />} />
                      <Route path="schedule" element={<SchedulePage />} />
                      <Route path="bookings" element={<BookingsPage />} />
                      <Route path="absences" element={<AbsencesPage />} />
                      <Route path="revenue" element={<RoleRoute requiredRole="owner"><RevenuePage /></RoleRoute>} />
                      <Route path="manage" element={<RoleRoute requiredRole="owner"><ManagePage /></RoleRoute>} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
