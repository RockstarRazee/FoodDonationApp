import { useState, useEffect } from 'react';
import { getVolunteerDashboard } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaBoxOpen, FaClock, FaCheckCircle, FaMapMarkerAlt, FaExclamationCircle } from 'react-icons/fa';
import { socket } from '../../services/socket';

const VolunteerOverview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const { data } = await getVolunteerDashboard();
            setData(data);
            setLoading(false);
        } catch (error) {
            console.error("Dashboard Error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Real-time listeners
        const handleUpdate = () => fetchData();
        socket.on('donationUpdated', handleUpdate);
        socket.on('donationCreated', handleUpdate); // New available orders

        return () => {
            socket.off('donationUpdated', handleUpdate);
            socket.off('donationCreated', handleUpdate);
        };
    }, []);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading dashboard...</div>;

    const { overview, currentMission } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">


            {/* Current Mission Hero Card */}
            {currentMission ? (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <FaTruck className="text-9xl transform rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                Current Mission
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{currentMission.foodType}</h2>
                                <p className="text-blue-100 mb-6 flex items-center">
                                    <FaBoxOpen className="mr-2" /> {currentMission.quantity} • {currentMission.status === 'assigned' ? 'Pickup required' : 'Delivery required'}
                                </p>

                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => navigate('/volunteer/deliveries')}
                                        className="px-6 py-3 bg-white text-blue-700 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-colors transform hover:-translate-y-1"
                                    >
                                        Manage Delivery
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-1"><FaMapMarkerAlt className="text-green-300" /></div>
                                        <div>
                                            <p className="text-xs text-blue-200 uppercase tracking-widest">From</p>
                                            <p className="font-semibold text-sm">{currentMission.donor?.name || "Unknown Donor"}</p>
                                            <p className="text-xs text-blue-100">{currentMission.location?.address || "Pickup Location N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="w-0.5 h-4 bg-white/20 ml-1.5"></div>
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-1"><FaMapMarkerAlt className="text-red-300" /></div>
                                        <div>
                                            <p className="text-xs text-blue-200 uppercase tracking-widest">To</p>
                                            <p className="font-semibold text-sm">{currentMission.recipient?.name || "Recipient"}</p>
                                            <p className="text-xs text-blue-100">{currentMission.recipient?.location?.address || currentMission.recipientLocation?.address || "Dropoff Location N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <FaCheckCircle />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
                    <p className="text-gray-500 mb-6">You have no active deliveries right now. Check available orders to help someone.</p>
                    <button
                        onClick={() => navigate('/volunteer/available')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        Find Orders
                    </button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={<FaCheckCircle />}
                    label="Completed Today"
                    value={overview.completedToday}
                    color="green"
                    subtext="Great job!"
                />
                <StatCard
                    icon={<FaTruck />}
                    label="Active Deliveries"
                    value={overview.activeCount}
                    color="blue"
                    subtext="In progress"
                />
                <StatCard
                    icon={<FaClock />}
                    label="Avg Time"
                    value={`${overview.avgDeliveryTime}m`}
                    color="purple"
                    subtext="Per delivery"
                />
                <StatCard
                    icon={<FaExclamationCircle />}
                    label="Reliability"
                    value={`${overview.reliabilityScore}%`}
                    color="orange"
                    subtext="Score"
                />
            </div>

            {/* Fast Deliveries History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Past Deliveries</h2>
                    {/* <button className="text-blue-600 text-sm font-semibold hover:underline">View All</button> */}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Food Item</th>
                                <th className="px-6 py-4 text-left font-semibold">From / To</th>
                                <th className="px-6 py-4 text-left font-semibold">Completed At</th>
                                <th className="px-6 py-4 text-left font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.pastDeliveries && data.pastDeliveries.length > 0 ? (
                                data.pastDeliveries.map((delivery) => (
                                    <tr key={delivery._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-3">
                                                    <FaBoxOpen />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{delivery.foodType}</p>
                                                    <p className="text-xs text-gray-500">{delivery.quantity}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <FaMapMarkerAlt className="mr-1.5 text-green-500" />
                                                    <span title={delivery.location?.address}>{delivery.location?.address?.split(',')[0] || "Unknown Location"}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <FaMapMarkerAlt className="mr-1.5 text-red-500" />
                                                    <span title={delivery.recipientLocation?.address}>{delivery.recipientLocation?.address?.split(',')[0] || "Recipient Location"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {new Date(delivery.completedAt || delivery.deliveredAt || delivery.updatedAt).toLocaleDateString(undefined, {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(delivery.completedAt || delivery.deliveredAt || delivery.updatedAt).toLocaleTimeString([], {
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-flex items-center">
                                                <FaCheckCircle className="mr-1.5" />
                                                {delivery.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No past deliveries found. Start your first mission today!
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

const StatCard = ({ icon, label, value, color, subtext }) => {
    const colors = {
        green: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    {icon}
                </div>
                {/* <span className="text-xs font-bold text-gray-300">...</span> */}
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{subtext}</p>
        </div>
    );
};

export default VolunteerOverview;
