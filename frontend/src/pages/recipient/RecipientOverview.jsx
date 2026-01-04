import { useState, useEffect } from 'react';
import { getRecipientDashboard } from '../../services/api';
import { socket } from '../../services/socket';
import { FaHeart, FaUtensils, FaCheckCircle, FaClock, FaPhone, FaUserShield, FaMapMarkerAlt, FaLock } from 'react-icons/fa';
import { getImageUrl } from '../../utils/imageHelper';
import toast from 'react-hot-toast';

const RecipientOverview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const { data } = await getRecipientDashboard();
            setData(data);
            setLoading(false);
        } catch (error) {
            console.error("Dashboard Error:", error);
            // toast.error('Failed to load dashboard data');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleUpdate = (payload) => {
            console.log("Socket update received:", payload);

            // Optimistic Update for Delivery OTP
            if (payload && payload.otp && payload.recipientId) {
                setData(prevData => {
                    if (!prevData) return prevData;

                    const updatedRequests = prevData.activeRequests.map(req => {
                        if (req.donationId === payload.donationId) {
                            return {
                                ...req,
                                deliveryOtp: { code: payload.otp, verified: false }
                            };
                        }
                        return req;
                    });

                    return { ...prevData, activeRequests: updatedRequests };
                });
            }

            fetchData();
        };

        socket.on('donationUpdated', handleUpdate);
        socket.on('deliveryOtpGenerated', handleUpdate);

        return () => {
            socket.off('donationUpdated', handleUpdate);
            socket.off('deliveryOtpGenerated', handleUpdate);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!data) return null;

    const { overview, activeRequests } = data;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome Back! 🌿</h1>
                    <p className="text-emerald-50 opacity-90 text-lg max-w-xl">
                        {activeRequests && activeRequests.length > 0
                            ? `You have ${activeRequests.length} active request${activeRequests.length > 1 ? 's' : ''} being processed.`
                            : "No active requests right now. Browse nearby donations to get support."}
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                    <FaHeart className="text-9xl" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    icon={FaUtensils}
                    title="Meals Received"
                    value={overview.mealsReceived}
                    color="bg-emerald-100 text-emerald-600"
                />
                <KPICard
                    icon={FaCheckCircle}
                    title="Completed Requests"
                    value={overview.completedRequests}
                    color="bg-blue-100 text-blue-600"
                />
                <KPICard
                    icon={FaClock}
                    title="Active Requests"
                    value={overview.activeRequests}
                    color="bg-orange-100 text-orange-600"
                />
            </div>

            {/* Active Requests List */}
            {activeRequests && activeRequests.length > 0 ? (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <span className="w-2 h-8 bg-emerald-500 rounded-r-full mr-3"></span>
                        Live Requests
                    </h2>
                    {activeRequests.map((req) => (
                        <ActiveRequestCard key={req.donationId} request={req} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-200 hover:border-emerald-300 transition-colors group cursor-pointer" onClick={() => window.location.href = '/recipient/browse'}>
                    <div className="bg-emerald-50 text-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <FaUtensils className="text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Requests</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Hungry? Browse available food donations near you and verify your location to get started.</p>
                    <button className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-emerald-700 transition-all">
                        Browse Food
                    </button>
                </div>
            )}
        </div>
    );
};

const ActiveRequestCard = ({ request }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-emerald-800 uppercase tracking-wide text-sm">Live Request</span>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white text-emerald-600 rounded-full border border-emerald-200 uppercase">
                {request.status}
            </span>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-8">
            {/* Left: Food Details */}
            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{request.foodType}</h3>
                <div className="space-y-3 text-gray-600">
                    <div className="flex items-center">
                        <FaUtensils className="w-5 text-gray-400 mr-3" />
                        <span>Quantity: <span className="font-medium text-gray-800">{request.quantity}</span></span>
                    </div>
                    <div className="flex items-center">
                        <FaClock className="w-5 text-gray-400 mr-3" />
                        <span>Expires: <span className="font-medium text-gray-800">{new Date(request.expiryDate).toLocaleDateString()}</span></span>
                    </div>
                    {request.eta && (
                        <div className="flex items-center text-orange-600 bg-orange-50 px-3 py-2 rounded-lg inline-block">
                            <FaClock className="w-5 mr-2" />
                            <span className="font-bold">ETA: {new Date(request.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Volunteer & OTP */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col justify-center">
                {request.volunteer ? (
                    <>
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xl mr-4 border-2 border-white shadow-sm">
                                {request.volunteer.avatar ? (
                                    <img src={getImageUrl(request.volunteer.avatar)} alt="Vol" className="w-full h-full rounded-full object-cover" />
                                ) : request.volunteer.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Assigned Volunteer</p>
                                <p className="font-bold text-gray-800">{request.volunteer.name}</p>
                            </div>
                        </div>

                        {request.volunteer.phone && (
                            <div className="flex items-center text-gray-600 mb-4 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                <FaPhone className="w-4 h-4 text-emerald-500 mr-2" />
                                <span className="text-sm font-medium">{request.volunteer.phone}</span>
                            </div>
                        )}

                        {/* OTP Display - Only if Assigned/Picked */}
                        {request.deliveryOtp && request.deliveryOtp.code && !request.deliveryOtp.verified && (
                            <div className="mt-auto">
                                <div className="bg-white border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center relative overflow-hidden group hover:border-emerald-500 transition-colors">
                                    <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">Secure Delivery OTP</p>
                                    <div className="flex items-center justify-center gap-2 text-2xl font-mono font-black text-emerald-700 tracking-widest">
                                        <FaLock className="text-lg text-emerald-400" />
                                        {request.deliveryOtp.code}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Share this with volunteer upon delivery only</p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-gray-500 py-4">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="bg-gray-200 rounded-full h-12 w-12 mb-3"></div>
                            <p className="text-sm">Looking for a nearby volunteer...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        {/* Status Progress Bar */}
        <div className="h-1.5 w-full bg-gray-100">
            <div
                className={`h-full bg-emerald-500 transition-all duration-1000 ease-out`}
                style={{ width: getProgressWidth(request.status) }}
            ></div>
        </div>
    </div>
);

const KPICard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${color}`}>
            <Icon className="text-2xl" />
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const getProgressWidth = (status) => {
    switch (status) {
        case 'posted': return '10%';
        case 'requested': return '25%';
        case 'assigned': return '50%';
        case 'picked': return '75%';
        case 'delivered': return '90%';
        case 'completed': return '100%';
        default: return '0%';
    }
};

export default RecipientOverview;
