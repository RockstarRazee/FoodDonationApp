import { Link, useLocation } from 'react-router-dom';
import { FaChartPie, FaBoxOpen, FaUsers, FaChartLine, FaSignOutAlt, FaLeaf, FaUser, FaHome, FaHistory, FaHeart, FaStar, FaHandHoldingHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ logout }) => {
    const location = useLocation();
    const { user } = useAuth();

    const isActive = (path) => location.pathname.includes(path);

    const getNavItems = () => {
        if (user?.role === 'admin') {
            return [
                { path: 'orders', label: 'Orders & Deliveries', icon: FaBoxOpen },
                { path: 'analytics', label: 'Analytics', icon: FaChartLine },
                { path: 'users', label: 'User List', icon: FaUsers },
                { path: 'performance', label: 'Performance', icon: FaChartPie },
                { path: 'profile', label: 'Profile', icon: FaUser },
            ];
        } else if (user?.role === 'donor') {
            return [
                { path: 'overview', label: 'Donate Now', icon: FaHandHoldingHeart },
                { path: 'donations', label: 'My Donations', icon: FaBoxOpen },
                { path: 'analytics', label: 'Analytics', icon: FaChartLine },

                { path: 'profile', label: 'Profile', icon: FaUser },
            ];
        }
        return [];
    };

    const navItems = getNavItems();

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl z-10 shrink-0">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <FaLeaf className="text-emerald-600 text-2xl mr-3" />
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">FoodConnect</h1>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{user?.role} Panel</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={`/dashboard/${item.path}`}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive(item.path)
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <item.icon className={`mr-3 text-lg transition-colors ${isActive(item.path) ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                            }`} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <FaSignOutAlt className="mr-3 text-lg" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
