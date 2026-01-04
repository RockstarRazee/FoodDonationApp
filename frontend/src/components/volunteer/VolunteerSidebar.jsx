import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaTachometerAlt, FaBoxOpen, FaTruck, FaChartLine, FaUser, FaSignOutAlt, FaLeaf } from 'react-icons/fa';

const VolunteerSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/volunteer', icon: <FaTachometerAlt />, label: 'Overview', end: true },
        { path: '/volunteer/available', icon: <FaBoxOpen />, label: 'Available Orders' },
        { path: '/volunteer/deliveries', icon: <FaTruck />, label: 'My Deliveries' },
        { path: '/volunteer/analytics', icon: <FaChartLine />, label: 'Analytics' },
        { path: '/volunteer/profile', icon: <FaUser />, label: 'Profile' },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 bg-white shadow-xl h-full border-r border-gray-100 z-10 transition-all duration-300">
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <FaLeaf className="text-emerald-600 text-2xl mr-3" />
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">FoodConnect</h1>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Volunteer Panel</span>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                    Menu
                </p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group font-medium ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1'
                            }`
                        }
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3.5 w-full rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group font-medium"
                >
                    <FaSignOutAlt className="text-lg group-hover:rotate-180 transition-transform duration-300" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default VolunteerSidebar;
