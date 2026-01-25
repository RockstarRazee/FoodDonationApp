import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminOverview from './admin/AdminOverview';
import AdminOrders from './admin/AdminOrders';
import AdminPerformance from './admin/AdminPerformance';
import AdminUsers from './admin/AdminUsers';
import AdminProfile from './admin/AdminProfile';

const AdminDashboard = () => {
    return (
        <DashboardLayout>
            <Routes>
                <Route path="/" element={<Navigate to="analytics" replace />} />
                <Route path="analytics" element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="performance" element={<AdminPerformance />} />
                <Route path="profile" element={<AdminProfile />} />
            </Routes>
        </DashboardLayout>
    );
};

export default AdminDashboard;
