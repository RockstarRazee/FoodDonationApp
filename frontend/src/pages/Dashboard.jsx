import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VolunteerDashboard from './VolunteerDashboard';
import DonorDashboard from './DonorDashboard';
import RecipientDashboard from './RecipientDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
    const { user } = useAuth();

    if (user?.role === 'admin') {
        return <AdminDashboard />;
    }

    if (user?.role === 'volunteer') {
        return <Navigate to="/volunteer" replace />;
    }

    if (user?.role === 'recipient') {
        return <Navigate to="/recipient" replace />;
    }

    return <DonorDashboard />;
};

export default Dashboard;
