import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DonorOverview from './donor/DonorOverview';
import DonorDonations from './donor/DonorDonations';
import DonorAnalytics from './donor/DonorAnalytics';
import DonorImpact from './donor/DonorImpact';
import DonorProfile from './donor/DonorProfile';
import Donate from './Donate'; // Reuse existing Donate page? Or move it?

const DonorDashboard = () => {
    return (
        <DashboardLayout>
            <Routes>
                <Route path="/" element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<DonorOverview />} />
                <Route path="donations" element={<DonorDonations />} />
                <Route path="analytics" element={<DonorAnalytics />} />
                <Route path="impact" element={<DonorImpact />} />
                <Route path="profile" element={<DonorProfile />} />
                <Route path="donate" element={<Donate />} />
            </Routes>
        </DashboardLayout>
    );
};

export default DonorDashboard;
