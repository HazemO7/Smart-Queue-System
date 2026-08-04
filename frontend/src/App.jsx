import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClinicsPage from './pages/patient/ClinicsPage';
import BookingPage from './pages/patient/BookingPage';
import TicketPage from './pages/patient/TicketPage';
import DashboardPage from './pages/admin/DashboardPage';
import QueueManagementPage from './pages/admin/QueueManagementPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient Routes */}
        <Route path="/clinics" element={
          <ProtectedRoute requiredRole="patient">
            <ClinicsPage />
          </ProtectedRoute>
        } />
        <Route path="/book/:clinicId" element={
          <ProtectedRoute requiredRole="patient">
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="/ticket" element={
          <ProtectedRoute requiredRole="patient">
            <TicketPage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/queue/:clinicId" element={
          <ProtectedRoute requiredRole="admin">
            <QueueManagementPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;



