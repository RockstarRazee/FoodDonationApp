import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaCircle } from 'react-icons/fa';
import { getAdminNotifications } from '../../services/api';
import { socket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageHelper';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchNotifications();
        }

        // Real-time listeners
        const handleNew = (data) => {
            // Only admins might see all created donations
            if (user?.role === 'admin') {
                addNotification({
                    _id: Date.now(),
                    message: `New donation: ${data.foodType}`,
                    time: new Date(),
                    status: 'posted'
                });
            } else if (user?.role === 'donor' && data.donorId === user._id) {
                // Donor specific notifications (future enhancement)
            }
        };

        const handleUpdate = (data) => {
            // Logic for updates
            // For now basics
            if (user?.role === 'admin') {
                addNotification({
                    _id: Date.now(),
                    message: `Status update: ${data.status}`,
                    time: new Date(),
                    status: data.status
                });
            }
        };

        socket.on('donationCreated', handleNew);
        socket.on('donationUpdated', handleUpdate);

        // Click outside to close
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            socket.off('donationCreated', handleNew);
            socket.off('donationUpdated', handleUpdate);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data } = await getAdminNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications');
        }
    };

    const addNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications) {
            setUnreadCount(0); // Mark all as read when opening
        }
    };

    const getTitle = () => {
        // Handle root paths which might imply dashboard/overview
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const path = pathSegments.pop();
        const parent = pathSegments[0]; // e.g. 'volunteer', 'dashboard'

        // Admin
        if (path === 'orders') return 'Order Management';
        if (path === 'analytics' && user?.role === 'admin') return 'Analytics & Reports';
        if (path === 'performance') return 'Team Performance';
        if (path === 'users') return 'User List';

        // Donor
        if (path === 'overview') return 'Donor Overview';
        if (path === 'donations') return 'My Donations';
        if (path === 'impact') return 'My Impact';
        if (path === 'analytics' && user?.role === 'donor') return 'Donation Analytics';

        // Recipient
        if (path === 'browse') return 'Browse Donations';
        if (path === 'requests') return 'My Requests';
        if (path === 'analytics' && user?.role === 'recipient') return 'Community Hall of Fame';

        // Volunteer
        if (path === 'volunteer') return 'Volunteer Overview';
        if (path === 'available') return 'Available Orders';
        if (path === 'deliveries') return 'My Deliveries';
        if (path === 'analytics') return 'Impact & Analytics';

        // Shared
        if (path === 'profile') return 'My Profile';

        return 'Dashboard';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'posted': return 'text-yellow-500';
            case 'delivered': return 'text-emerald-500';
            case 'expired': return 'text-red-500';
            default: return 'text-blue-500';
        }
    };

    return (
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex justify-between items-center sticky top-0 z-20 backdrop-blur-sm bg-opacity-90 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{getTitle()}</h2>
                <p className="text-sm text-gray-500">Welcome back, {user?.name?.split(' ')[0]}</p>
            </div>

            <div className="flex items-center space-x-6">

                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        className="relative cursor-pointer text-gray-500 hover:text-emerald-600 transition p-2"
                        onClick={toggleNotifications}
                    >
                        <FaBell className="text-xl" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center border border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>

                    {/* Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animation-fade-in-up origin-top-right">
                            <div className="p-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700">Notifications</h3>
                                <span className="text-xs text-emerald-600 font-medium cursor-pointer hover:underline">Mark all read</span>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                                ) : (
                                    notifications.map((notif, index) => (
                                        <div
                                            key={notif._id || index}
                                            className="p-4 border-b border-gray-50 hover:bg-blue-50 transition-colors flex items-start cursor-pointer"
                                            onClick={() => {
                                                setShowNotifications(false);
                                                navigate('/dashboard/orders'); // Default nav
                                            }}
                                        >
                                            <FaCircle className={`mt-1.5 mr-3 text-[10px] ${getStatusColor(notif.status)}`} />
                                            <div>
                                                <p className="text-sm text-gray-800 font-medium">{notif.message}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {' - '}
                                                    {new Date(notif.time).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-3 text-center border-t border-gray-50 bg-gray-50">
                                <button className="text-xs font-semibold text-gray-500 hover:text-gray-800">View All Activity</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Circle */}
                <div
                    className="flex items-center space-x-3 pl-6 border-l border-gray-200 cursor-pointer hover:opacity-80 transition"
                    onClick={() => navigate('/dashboard/profile')}
                    title="View Profile"
                >
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white overflow-hidden">
                        {user?.avatar ? (
                            <img
                                src={getImageUrl(user.avatar)}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            user?.name?.charAt(0)?.toUpperCase() || 'A'
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
