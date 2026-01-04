import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { socket, connectSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const DashboardLayout = ({ children }) => {
    const { logout, user } = useAuth();

    useEffect(() => {
        connectSocket();
    }, [user]);

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar logout={logout} />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
