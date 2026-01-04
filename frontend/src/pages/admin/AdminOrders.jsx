import { useState, useEffect } from 'react';
import { getAdminDonations } from '../../services/api';
import { FaSearch, FaFilter, FaMapMarkerAlt } from 'react-icons/fa';

const AdminOrders = () => {
    const [donations, setDonations] = useState([]);
    const [filteredDonations, setFilteredDonations] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDonations();
    }, []);

    useEffect(() => {
        filterData();
    }, [search, statusFilter, donations]);

    const fetchDonations = async () => {
        try {
            const { data } = await getAdminDonations();
            setDonations(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const filterData = () => {
        let temp = [...donations];
        if (statusFilter !== 'all') {
            temp = temp.filter(d => d.status === statusFilter);
        }
        if (search) {
            temp = temp.filter(d =>
                d.donor?.name.toLowerCase().includes(search.toLowerCase()) ||
                d.foodType.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFilteredDonations(temp);
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            posted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            requested: 'bg-blue-100 text-blue-800 border-blue-200',
            assigned: 'bg-purple-100 text-purple-800 border-purple-200',
            picked: 'bg-orange-100 text-orange-800 border-orange-200',
            delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            expired: 'bg-red-100 text-red-800 border-red-200',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100'}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative w-full md:w-96">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search donor, ID, or food type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                </div>
                <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'posted', 'requested', 'assigned', 'delivered', 'completed', 'expired'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === status
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                <th className="px-6 py-4 font-semibold">Food Type</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Donor</th>
                                <th className="px-6 py-4 font-semibold">Recipient</th>
                                <th className="px-6 py-4 font-semibold">Volunteer</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDonations.map(donation => (
                                <tr key={donation._id} className="hover:bg-blue-50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {donation.foodType}
                                        <span className="block text-xs text-gray-400 font-normal">{donation.quantity}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={donation.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-2">
                                                {donation.donor?.name.charAt(0)}
                                            </div>
                                            {donation.donor?.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {donation.recipient ? donation.recipient.name : <span className="text-gray-400 italic">Pending</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {donation.volunteer ? donation.volunteer.name : <span className="text-gray-400 italic">Unassigned</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(donation.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(donation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                            {filteredDonations.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        No orders found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
