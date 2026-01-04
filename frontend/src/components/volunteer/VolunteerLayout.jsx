import { Outlet } from 'react-router-dom';
import VolunteerSidebar from './VolunteerSidebar';
import Header from '../layout/Header';

const VolunteerLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <VolunteerSidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header />

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default VolunteerLayout;
