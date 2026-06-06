import { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getToken } from './api/auth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/HomePage';
import AddGaragePage from './pages/AddGaragePage';
import ProfilePage from './pages/ProfilePage';
import AddVehiclePage from './pages/AddVehiclePage';
import TrackApplicationPage from './pages/TrackApplicationPage';
import SearchPage from './pages/SearchPage';
import UserBookingsPage from './pages/UserBookingsPage';
import AdminPickupsPage from './pages/AdminPickupsPage';
import LotOwnerDashboardPage from './pages/lot-owner/LotOwnerDashboardPage';
import LotOwnerPropertiesPage from './pages/lot-owner/LotOwnerPropertiesPage';
import LotOwnerLayout from './components/LotOwnerLayout';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import AgreementPage from './pages/AgreementPage';
import PickupOptionsPage from './pages/PickupOptionsPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminApplicationsPage from './pages/AdminApplicationsPage';
import LotOwnerBookingsPage from './pages/lot-owner/LotOwnerBookingsPage';
import LotOwnerBookingDetailsPage from './pages/lot-owner/LotOwnerBookingDetailsPage';
import VerificationPendingPage from './pages/VerificationPendingPage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("ErrorBoundary caught an error", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fdd', color: '#900', height: '100vh', overflow: 'auto' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function getUserRole() {
  const token = getToken('AccessToken');
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return parseInt(decoded.roleId, 10);
    } catch {
      return null;
    }
  }
  return null;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const role = getUserRole();
  if (role === 5) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (role === 2 || role === 4) {
    return <Navigate to="/lot-owner/dashboard" replace />;
  }
  
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const role = getUserRole();
  return role === 5 ? children : <Navigate to="/home" replace />;
}

function LotOwnerRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const role = getUserRole();
  return (role === 2 || role === 4) ? children : <Navigate to="/home" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  
  if (isAuthenticated) {
    const role = getUserRole();
    if (role === 5) return <Navigate to="/admin/dashboard" replace />;
    if (role === 2 || role === 4) return <Navigate to="/lot-owner/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="bookings" element={<LotOwnerBookingsPage />} />
          <Route path="bookings/:id" element={<LotOwnerBookingDetailsPage />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="/lot-owner" element={
          <LotOwnerRoute>
            <LotOwnerLayout />
          </LotOwnerRoute>
        }>
          <Route path="dashboard" element={<LotOwnerDashboardPage />} />
          <Route path="properties" element={<LotOwnerPropertiesPage />} />
          <Route path="bookings" element={<LotOwnerBookingsPage />} />
          <Route path="bookings/:id" element={<LotOwnerBookingDetailsPage />} />
          <Route path="pickups" element={<AdminPickupsPage />} />
          <Route path="*" element={<Navigate to="/lot-owner/dashboard" replace />} />
        </Route>

        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        } />
        <Route path="/garage/:id" element={
          <ProtectedRoute>
            <PropertyDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/booking-verification/:id" element={
          <ProtectedRoute>
            <VerificationPendingPage />
          </ProtectedRoute>
        } />
        <Route path="/agreement/:id" element={
          <ProtectedRoute>
            <AgreementPage />
          </ProtectedRoute>
        } />
        <Route path="/pickup-options/:id" element={
          <ProtectedRoute>
            <PickupOptionsPage />
          </ProtectedRoute>
        } />
        <Route path="/add-garage" element={
          <ProtectedRoute>
            <AddGaragePage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/add-vehicle" element={
          <ProtectedRoute>
            <AddVehiclePage />
          </ProtectedRoute>
        } />
        <Route path="/track-application" element={
          <ProtectedRoute>
            <TrackApplicationPage />
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute>
            <UserBookingsPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}