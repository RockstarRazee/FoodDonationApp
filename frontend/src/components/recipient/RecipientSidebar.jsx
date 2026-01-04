import { Link, useLocation } from 'react-router-dom';
import { FaChartPie, FaSearchLocation, FaClipboardList, FaTrophy, FaSignOutAlt, FaLeaf, FaUser } from 'react-icons/fa';

const RecipientSidebar = ({ logout }) => {
    const location = useLocation();

    // Helper to check active state (handles sub-routes if needed)
    const isActive = (path) => {
        if (path === '') return location.pathname === '/recipient' || location.pathname === '/recipient/';
        return location.pathname.includes(`/recipient/${path}`);
    };

    const navItems = [
        { path: '', label: 'Overview', icon: FaChartPie },
        { path: 'browse', label: 'Browse Food', icon: FaSearchLocation },
        { path: 'requests', label: 'My Requests', icon: FaClipboardList },
        { path: 'analytics', label: 'Top Performers', icon: FaTrophy },
        { path: 'profile', label: 'Profile', icon: FaUser },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl z-10 transition-all duration-300 hidden md:flex">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <FaLeaf className="text-emerald-600 text-2xl mr-3" />
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">FoodConnect</h1>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Recipient Panel</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={`/recipient/${item.path}`}
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

            {/* Logout */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
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

export default RecipientSidebar;
