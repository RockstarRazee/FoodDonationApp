import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import RecipientSidebar from './RecipientSidebar';
import Header from '../layout/Header'; // Reusing shared header
import { useAuth } from '../../context/AuthContext';
import { connectSocket, socket } from '../../services/socket';
import toast from 'react-hot-toast';

const RecipientLayout = () => {
    const { logout } = useAuth();

    useEffect(() => {
        // Connect socket on mount
        connectSocket();
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <RecipientSidebar logout={logout} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header /> {/* Can customize title prop if Header supports it, or it reads from context */}

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8">
                    <div className="animate-fade-in-up">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default RecipientLayout;
