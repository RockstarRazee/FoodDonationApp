import { useState, useEffect } from 'react';
import { getVolunteerDashboard, assignDonation } from '../../services/api';
import { FaMapMarkerAlt, FaUtensils, FaClock, FaCheck, FaTimes, FaBoxOpen, FaTruck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../services/socket';

const VolunteerAvailable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deadlines, setDeadlines] = useState({ pickup: '', delivery: '' });
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const { data } = await getVolunteerDashboard();
            setOrders(data.availableOrders);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleUpdate = (updatedDonation) => {
            // If any donation changes status to 'assigned', remove it from available list
            // Or if a new one is created/requested, add it (or just refetch)
            // Simplest: Refetch or filter
            if (updatedDonation.status === 'assigned') {
                setOrders(prev => prev.filter(o => o._id !== updatedDonation.donationId));
            } else if (updatedDonation.status === 'requested') {
                // If it becomes requested, it should appear. But we need full object.
                // Fetching single item or full list is safer.
                fetchData();
            }
        };

        socket.on('donationUpdated', handleUpdate);
        return () => socket.off('donationUpdated', handleUpdate);
    }, []);

    const handleAcceptClick = (order) => {
        setSelectedOrder(order);
        // Default deadlines: Pickup in 1h, Delivery in 2h
        const now = new Date();
        const pickup = new Date(now.getTime() + 60 * 60 * 1000);
        const delivery = new Date(now.getTime() + 120 * 60 * 1000);

        // Format for datetime-local: YYYY-MM-DDTHH:mm
        const toLocalISO = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().slice(0, 16);
        };

        setDeadlines({
            pickup: toLocalISO(pickup),
            delivery: toLocalISO(delivery)
        });
    };

    const confirmAccept = async () => {
        if (!deadlines.pickup || !deadlines.delivery) {
            toast.error("Please set both deadlines");
            return;
        }

        try {
            await assignDonation(selectedOrder._id, {
                pickupDeadline: deadlines.pickup,
                deliveryDeadline: deadlines.delivery
            });
            toast.success("Order accepted! Head to My Deliveries.");
            setSelectedOrder(null);
            navigate('/volunteer/deliveries');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept order");
        }
    };

    // Helper: Haversine Distance in KM
    const calculateDistance = (coords1, coords2) => {
        if (!coords1 || !coords2) return 0;
        const toRad = (x) => (x * Math.PI) / 180;
        const R = 6371; // Earth radius in km
        const dLat = toRad(coords2[1] - coords1[1]); // lat is index 1 in [lng, lat]
        const dLon = toRad(coords2[0] - coords1[0]);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(coords1[1])) * Math.cos(toRad(coords2[1])) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const openMap = (coords) => {
        if (!coords) return;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map(order => (
                    <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                        <div className="p-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-gray-800">{order.foodType}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'requested' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="space-y-3 text-sm text-gray-600 mb-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <FaMapMarkerAlt className="mt-1 mr-2 text-green-500" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Pickup</p>
                                            <p className="text-gray-600">{order.location?.address || "Unknown"}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => openMap(order.location?.coordinates)} className="text-blue-500 hover:text-blue-700 text-xs font-bold border border-blue-200 px-2 py-1 rounded">Map ↗</button>
                                </div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <FaMapMarkerAlt className="mt-1 mr-2 text-red-500" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Deliver To</p>
                                            <p className="text-gray-600">{order.recipientLocation?.address || "Recipient pending"}</p>
                                        </div>
                                    </div>
                                    {order.recipientLocation?.coordinates && (
                                        <button onClick={() => openMap(order.recipientLocation.coordinates)} className="text-blue-500 hover:text-blue-700 text-xs font-bold border border-blue-200 px-2 py-1 rounded">Map ↗</button>
                                    )}
                                </div>
                                <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                    <FaClock className="mr-2" />
                                    <span>Expires: {new Date(order.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {order.location && order.recipientLocation && order.recipientLocation.coordinates && (
                                    <div className="flex items-center text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                        <FaTruck className="mr-2" />
                                        <span>Trip Distance: {calculateDistance(order.location.coordinates, order.recipientLocation.coordinates)} km</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleAcceptClick(order)}
                                className="w-full py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all transform hover:-translate-y-1 shadow-sm"
                            >
                                Accept Mission
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100">
                    <div className="inline-block p-4 rounded-full bg-gray-50 text-gray-300 text-4xl mb-4"><FaBoxOpen /></div>
                    <p className="text-gray-500 font-medium">No orders available right now.</p>
                    <p className="text-sm text-gray-400">Check back later or expand your radius.</p>
                </div>
            )}


            {/* Accept Modal */}
            {
                selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800">Confirm Acceptance</h3>
                                <p className="text-sm text-gray-500">Set your estimated arrival times.</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pickup By</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={deadlines.pickup}
                                        onChange={e => setDeadlines({ ...deadlines, pickup: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Deliver By</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={deadlines.delivery}
                                        onChange={e => setDeadlines({ ...deadlines, delivery: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAccept}
                                    className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors"
                                >
                                    Confirm & Start
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default VolunteerAvailable;
