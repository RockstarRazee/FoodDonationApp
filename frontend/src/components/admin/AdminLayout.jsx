import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { socket, connectSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const AdminLayout = ({ children }) => {
    const { logout } = useAuth();

    useEffect(() => {
        connectSocket();
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar logout={logout} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
