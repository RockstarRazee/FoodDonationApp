import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RoleSelection from './pages/RoleSelection';
import RootRedirect from './components/RootRedirect';
import RecipientLayout from './components/recipient/RecipientLayout';
import { RecipientOverview, RecipientBrowse, RecipientRequests, RecipientAnalytics, RecipientProfile } from './pages/recipient/RecipientPages';
import VolunteerLayout from './components/volunteer/VolunteerLayout';
import { VolunteerOverview, VolunteerAvailable, VolunteerDeliveries, VolunteerAnalytics, VolunteerProfile } from './pages/volunteer/VolunteerPages';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect to role selection if profile is incomplete
  if (!user.isProfileComplete && window.location.pathname !== '/select-role') {
    return <Navigate to="/select-role" />;
  }

  // Redirect to dashboard if profile is already complete and trying to access role selection
  if (user.isProfileComplete && window.location.pathname === '/select-role') {
    return <Navigate to="/dashboard" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user tries to access a route they aren't authorized for, send them to their own root
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="font-sans text-gray-900">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/select-role"
              element={
                <ProtectedRoute>
                  <RoleSelection />
                </ProtectedRoute>
              }
            />

            {/* Direct Recipient Routes */}
            <Route path="/recipient" element={
              <ProtectedRoute allowedRoles={['recipient']}>
                <RecipientLayout />
              </ProtectedRoute>
            }>
              <Route index element={<RecipientOverview />} />
              <Route path="browse" element={<RecipientBrowse />} />
              <Route path="requests" element={<RecipientRequests />} />
              <Route path="analytics" element={<RecipientAnalytics />} />
              <Route path="profile" element={<RecipientProfile />} />
            </Route>

            {/* Volunteer Routes */}
            <Route path="/volunteer" element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <VolunteerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<VolunteerOverview />} />
              <Route path="available" element={<VolunteerAvailable />} />
              <Route path="deliveries" element={<VolunteerDeliveries />} />
              <Route path="analytics" element={<VolunteerAnalytics />} />
              <Route path="profile" element={<VolunteerProfile />} />
            </Route>


            {/* Legacy/Other Dashboard Routes (Admin/Donor/Volunteer) */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/donate"
              element={<Navigate to="/dashboard/donate" replace />}
            />
            <Route
              path="/history"
              element={<Navigate to="/dashboard/donations" replace />}
            />
            <Route path="/" element={<RootRedirect />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </Router>
    </AuthProvider >
  );
}

export default App;
