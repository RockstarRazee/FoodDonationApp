import { useState, useEffect } from 'react';
import { getAdminUsers } from '../../services/api';
import { FaSearch, FaUser, FaEnvelope, FaCalendar, FaMapMarkerAlt, FaCircle } from 'react-icons/fa';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
        // Poll every 10 seconds for real-time updates without lagging
        const interval = setInterval(fetchUsers, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await getAdminUsers();
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="absolute top-4 right-8 z-10 w-full md:w-64">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm bg-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-100 group-hover:border-emerald-500 transition-colors">
                                        {user.avatar ? (
                                            <img src={`http://localhost:5000${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-500 text-2xl font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${user.isProfileComplete ? 'bg-green-500' : 'bg-gray-300'}`} title={user.isProfileComplete ? "Profile Complete" : "Incomplete Profile"}></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">{user.name}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${user.role === 'donor' ? 'bg-blue-100 text-blue-800' :
                                        user.role === 'volunteer' ? 'bg-emerald-100 text-emerald-800' :
                                            user.role === 'recipient' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-600 text-sm">
                                <FaEnvelope className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center text-gray-600 text-sm">
                                <FaCalendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                            {user.location && user.location.address && (
                                <div className="flex items-center text-gray-600 text-sm">
                                    <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-400" />
                                    <span className="truncate">{user.location.address}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                            <span>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
                            <span className="flex items-center">
                                <FaCircle className={`w-2 h-2 mr-1 ${user.isVerified ? 'text-green-500' : 'text-yellow-500'}`} />
                                {user.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                        </div>
                    </div>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <FaUser className="mx-auto text-4xl mb-4 text-gray-300" />
                        <p>No users found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
