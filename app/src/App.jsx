import { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import { getToken } from './api/auth';
import CallOverlay from './components/CallOverlay';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/HomePage';
import AddGaragePage from './pages/AddGaragePage';
import ProfilePage from './pages/ProfilePage';
import AddVehiclePage from './pages/AddVehiclePage';
import TrackApplicationPage from './pages/TrackApplicationPage';
import TrackPickupPage from './pages/TrackPickupPage';
import TrackServicePage from './pages/vehicle-owner/TrackServicePage';
import StoredVehicleDashboardPage from './pages/StoredVehicleDashboardPage';
import SearchPage from './pages/SearchPage';
import UserBookingsPage from './pages/UserBookingsPage';
import LotOwnerPickupsPage from './pages/lot-owner/LotOwnerPickupsPage';
import LotOwnerDashboardPage from './pages/lot-owner/LotOwnerDashboardPage';
import LotOwnerPropertiesPage from './pages/lot-owner/LotOwnerPropertiesPage';
import LotOwnerLayout from './components/LotOwnerLayout';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import NearbyServiceCentersPage from './pages/vehicle-owner/NearbyServiceCentersPage';
import VehicleOwnerPaymentsPage from './pages/vehicle-owner/VehicleOwnerPaymentsPage';
import AgreementPage from './pages/AgreementPage';
import PickupOptionsPage from './pages/PickupOptionsPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminApplicationsPage from './pages/AdminApplicationsPage';
import LotOwnerBookingsPage from './pages/lot-owner/LotOwnerBookingsPage';
import LotOwnerBookingDetailsPage from './pages/lot-owner/LotOwnerBookingDetailsPage';
import LotOwnerPickupDetailsPage from './pages/lot-owner/LotOwnerPickupDetailsPage';
import LotOwnerPaymentsPage from './pages/lot-owner/LotOwnerPaymentsPage';
import LotOwnerManagersPage from './pages/lot-owner/LotOwnerManagersPage';
import VerificationPendingPage from './pages/VerificationPendingPage';
import MessagesPage from './pages/MessagesPage';
import OwnerServicesPage from './pages/OwnerServicesPage';
import MyVehiclesPage from './pages/MyVehiclesPage';
import LotOwnerVehiclesPage from './pages/lot-owner/LotOwnerVehiclesPage';
import LotOwnerVehicleDetailsPage from './pages/lot-owner/LotOwnerVehicleDetailsPage';

import ServiceCenterLayout from './layouts/ServiceCenterLayout';
import SCDashboardPage from './pages/service-center/SCDashboardPage';
import SCBookingsPage from './pages/service-center/SCBookingsPage';
import SCBookingDetailsPage from './pages/service-center/SCBookingDetailsPage';
import SCMechanicsPage from './pages/service-center/SCMechanicsPage';
import SCAssignMechanicPage from './pages/service-center/SCAssignMechanicPage';

import ManagerServicesPage from './pages/lot-manager/ManagerServicesPage';
import ManagerServiceTrackingPage from './pages/lot-manager/ManagerServiceTrackingPage';
import LotOwnerServicesPage from './pages/lot-owner/LotOwnerServicesPage';
import LotOwnerServiceTrackingPage from './pages/lot-owner/LotOwnerServiceTrackingPage';

import ManagerLayout from './components/ManagerLayout';
import ManagerDashboardPage from './pages/lot-manager/ManagerDashboardPage';
import ManagerPickupsPage from './pages/lot-manager/ManagerPickupsPage';
import ManagerVehiclesPage from './pages/lot-manager/ManagerVehiclesPage';
import ManagerVehicleDetailsPage from './pages/lot-manager/ManagerVehicleDetailsPage';
import ManagerTasksPage from './pages/lot-manager/ManagerTasksPage';
import ManagerSubmitWeeklyPage from './pages/lot-manager/ManagerSubmitWeeklyPage';
import ManagerSubmitOnDemandPage from './pages/lot-manager/ManagerSubmitOnDemandPage';
import ManagerPickupDetailsPage from './pages/lot-manager/ManagerPickupDetailsPage';
import ManagerArrivedPage from './pages/lot-manager/ManagerArrivedPage';
import PreRideConditionPage from './pages/lot-manager/PreRideConditionPage';
import GarageArrivalConditionPage from './pages/lot-manager/GarageArrivalConditionPage';
import { NavigationProvider } from './context/NavigationContext';
import VehicleJourneyPage from './pages/vehicle-owner/VehicleJourneyPage';


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
  if (role === 2) {
    return <Navigate to="/lot-owner/dashboard" replace />;
  }
  if (role === 4) {
    return <Navigate to="/lot-manager/dashboard" replace />;
  }
  if (role === 6) {
    return <Navigate to="/service-center/dashboard" replace />;
  }
  
  return children;
}

function ServiceCenterRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const role = getUserRole();
  return role === 6 ? children : <Navigate to="/home" replace />;
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
  return role === 2 ? children : <Navigate to="/home" replace />;
}

function ManagerRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const role = getUserRole();
  return role === 4 ? children : <Navigate to="/home" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  
  if (isAuthenticated) {
    const role = getUserRole();
    if (role === 5) return <Navigate to="/admin/dashboard" replace />;
    if (role === 2) return <Navigate to="/lot-owner/dashboard" replace />;
    if (role === 4) return <Navigate to="/lot-manager/dashboard" replace />;
    if (role === 6) return <Navigate to="/service-center/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <CallOverlay />
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
          <Route path="managers" element={<LotOwnerManagersPage />} />
          <Route path="bookings" element={<LotOwnerBookingsPage />} />
          <Route path="bookings/:id" element={<LotOwnerBookingDetailsPage />} />
          <Route path="pickups" element={<LotOwnerPickupsPage />} />
          <Route path="pickup/:id" element={<LotOwnerPickupDetailsPage />} />
          <Route path="vehicles" element={<LotOwnerVehiclesPage />} />
          <Route path="payments" element={<LotOwnerPaymentsPage />} />
          <Route path="services" element={<LotOwnerServicesPage />} />
          <Route path="services/:id" element={<LotOwnerServiceTrackingPage />} />
          <Route path="vehicles/:id" element={<LotOwnerVehicleDetailsPage />} />
          <Route path="vehicle-journey/:vehicleId" element={<VehicleJourneyPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="*" element={<Navigate to="/lot-owner/dashboard" replace />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/lot-manager" element={
          <ManagerRoute>
            <NavigationProvider>
              <ManagerLayout />
            </NavigationProvider>
          </ManagerRoute>
        }>
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="pickups" element={<ManagerPickupsPage />} />

          <Route path="vehicles" element={<ManagerVehiclesPage />} />
          <Route path="services" element={<ManagerServicesPage />} />
          <Route path="services/:id" element={<ManagerServiceTrackingPage />} />
          <Route path="vehicle-details/:id" element={<ManagerVehicleDetailsPage />} />
          <Route path="tasks" element={<ManagerTasksPage />} />
          <Route path="submit-weekly/:id" element={<ManagerSubmitWeeklyPage />} />
          <Route path="submit-weekly/:id/:vehicleId" element={<ManagerSubmitWeeklyPage />} />
          <Route path="submit-ondemand/:id" element={<ManagerSubmitOnDemandPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="pickup-details/:id" element={<ManagerPickupDetailsPage />} />
          <Route path="manager-arrived/:id" element={<ManagerArrivedPage />} />
          <Route path="pre-ride-condition/:id" element={<PreRideConditionPage />} />
          <Route path="garage-arrival-condition/:id" element={<GarageArrivalConditionPage />} />
          <Route path="vehicle-journey/:vehicleId" element={<VehicleJourneyPage />} />
          <Route path="*" element={<Navigate to="/lot-manager/dashboard" replace />} />
        </Route>


        {/* Service Center Routes */}
        <Route path="/service-center" element={
          <ServiceCenterRoute>
            <ServiceCenterLayout />
          </ServiceCenterRoute>
        }>
          <Route path="dashboard" element={<SCDashboardPage />} />
          <Route path="bookings" element={<SCBookingsPage />} />
          <Route path="bookings/:id" element={<SCBookingDetailsPage />} />
          <Route path="bookings/:id/assign" element={<SCAssignMechanicPage />} />
          <Route path="mechanics" element={<SCMechanicsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="*" element={<Navigate to="/service-center/dashboard" replace />} />
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
        <Route path="/owner/nearby-services/:propertyId" element={
          <ProtectedRoute>
            <NearbyServiceCentersPage />
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
        <Route path="/track-pickup/:id" element={
          <ProtectedRoute allowedRoles={['VehicleOwner']}>
            <TrackPickupPage />
          </ProtectedRoute>
        } />
        <Route path="/track-service/:id" element={
          <ProtectedRoute allowedRoles={['VehicleOwner']}>
            <TrackServicePage />
          </ProtectedRoute>
        } />
        <Route path="/stored-vehicle/:id" element={
          <ProtectedRoute allowedRoles={['VehicleOwner']}>
            <StoredVehicleDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/my-vehicles" element={
          <ProtectedRoute>
            <MyVehiclesPage />
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute>
            <UserBookingsPage />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute>
            <VehicleOwnerPaymentsPage />
          </ProtectedRoute>
        } />
        <Route path="/vehicle-journey/:vehicleId" element={
          <ProtectedRoute>
            <VehicleJourneyPage />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}