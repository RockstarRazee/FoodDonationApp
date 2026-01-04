import { useState, useEffect } from 'react';
import { getNearbyDonations, requestDonation, getMyDonations, completeDonation } from '../services/api';
import { socket } from '../services/socket';
import toast from 'react-hot-toast';
import { FaUtensils, FaClock, FaCheckCircle, FaMapMarkerAlt, FaLock, FaBox, FaClipboardList, FaSpinner, FaTimes } from 'react-icons/fa';
import LocationPicker from '../components/LocationPicker';

const RecipientDashboard = () => {
    const [activeTab, setActiveTab] = useState('browse');
    const [donations, setDonations] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Location state - using fixed for now or browser API
    const [location, setLocation] = useState({ lat: 12.9716, lon: 77.5946 });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    console.log("Location access denied, utilizing defaults");
                }
            );
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'browse') {
            fetchNearby();
        } else {
            fetchMyRequests();
        }
    }, [activeTab, location]);

    useEffect(() => {
        const handleUpdate = () => {
            fetchNearby();
            fetchMyRequests();
        };

        socket.on('donationCreated', handleUpdate);
        socket.on('donationUpdated', handleUpdate);

        return () => {
            socket.off('donationCreated', handleUpdate);
            socket.off('donationUpdated', handleUpdate);
        };
    }, [location]);

    const fetchNearby = async () => {
        setLoading(true);
        try {
            const { data } = await getNearbyDonations(location.lat, location.lon, 5000000);
            setDonations(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch nearby donations');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const { data } = await getMyDonations();
            setMyRequests(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch your requests');
        } finally {
            setLoading(false);
        }
    };

    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [selectedDonationId, setSelectedDonationId] = useState(null);
    const [recipientLocation, setRecipientLocation] = useState(null); // [lng, lat]

    // ... (rest of simple string effects remain)

    const handleRequest = (id) => {
        setSelectedDonationId(id);
        setRecipientLocation(null); // Reset location
        setRequestModalOpen(true);
    };

    const confirmRequest = async () => {
        if (!recipientLocation) {
            toast.error('Please select a delivery location');
            return;
        }

        try {
            await requestDonation(selectedDonationId, recipientLocation); // Verify API accepts 2nd arg
            toast.success('Donation requested successfully!');
            setRequestModalOpen(false);
            fetchNearby();
            setActiveTab('requests');
        } catch (error) {
            console.error("Confirm Delivery Error:", error);
            toast.error(error.response?.data?.message || 'Confirmation failed');
        }
    };

    const handleConfirmDelivery = async (id) => {
        try {
            await completeDonation(id);
            toast.success('Delivery confirmed! Thank you.');
            fetchMyRequests();
        } catch (error) {
            console.error("Confirm Delivery Error:", error);
            toast.error(error.response?.data?.message || 'Confirmation failed');
        }
    };

    const handleLocationSelect = (loc) => {
        setRecipientLocation(loc);
    };

    // ... (rest of render)

    return (
        <div className="container mx-auto px-4 py-8 relative">
            {/* ... (Header and Tabs) */}
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500 mb-8">
                Recipient Dashboard
            </h1>

            <div className="flex space-x-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`pb-4 px-4 text-lg font-medium transition-all ${activeTab === 'browse'
                        ? 'border-b-2 border-green-500 text-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Browse Food
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-4 px-4 text-lg font-medium transition-all ${activeTab === 'requests'
                        ? 'border-b-2 border-green-500 text-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    My Requests
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'browse' ? (
                        donations.length === 0 ? (
                            <p className="col-span-full text-center text-gray-500 py-12">No available food nearby. Check back later!</p>
                        ) : (
                            donations.map(donation => (
                                <DonationCard
                                    key={donation._id}
                                    donation={donation}
                                    onRequest={() => handleRequest(donation._id)}
                                />
                            ))
                        )
                    ) : (
                        myRequests.length === 0 ? (
                            <p className="col-span-full text-center text-gray-500 py-12">You haven't requested any food yet.</p>
                        ) : (
                            myRequests.map(donation => (
                                <RequestStatusCard
                                    key={donation._id}
                                    donation={donation}
                                    onConfirm={() => handleConfirmDelivery(donation._id)}
                                />
                            ))
                        )
                    )}
                </div>
            )}

            {/* Request Modal */}
            {requestModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Select Delivery Location</h3>
                            <button
                                onClick={() => setRequestModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Please pin your exact location so the volunteer can reach you easily.
                        </p>

                        <div className="mb-6">
                            <LocationPicker location={recipientLocation} onLocationSelect={handleLocationSelect} />
                        </div>

                        <button
                            onClick={confirmRequest}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                        >
                            Confirm Request
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DonationCard = ({ donation, onRequest }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 overflow-hidden">
        <div className="p-6">
            <div className="flex justify-between items-start mb-4">
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Available
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                    <FaClock className="mr-1" />
                    {new Date(donation.expiryDate).toLocaleDateString()}
                </span>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">{donation.foodType}</h3>

            <div className="space-y-2 mb-6">
                <div className="flex items-center text-gray-600">
                    <FaUtensils className="mr-3 text-green-500" />
                    <span>{donation.quantity}</span>
                </div>
                <div className="flex items-start text-gray-600">
                    <FaMapMarkerAlt className="mr-3 mt-1 text-red-400" />
                    <span className="text-sm line-clamp-2">{donation.location?.address || 'Location provided'}</span>
                </div>
            </div>

            <button
                onClick={onRequest}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
            >
                Request Food
            </button>
        </div>
    </div>
);

const RequestStatusCard = ({ donation, onConfirm }) => {
    const isRequested = donation.status === 'requested';
    const isAssigned = donation.status === 'assigned';
    const isPicked = donation.status === 'picked';
    const isDelivered = donation.status === 'delivered';
    const isCompleted = donation.status === 'completed';

    // Determine Status Text & Color
    let statusText = 'Waiting for Volunteer';
    let statusColor = 'bg-yellow-100 text-yellow-800';

    if (isAssigned) {
        statusText = 'Volunteer Assigned';
        statusColor = 'bg-blue-100 text-blue-800';
    } else if (isPicked) {
        statusText = 'Out for Delivery';
        statusColor = 'bg-purple-100 text-purple-800';
    } else if (isDelivered) {
        statusText = 'Delivered';
        statusColor = 'bg-green-100 text-green-800';
    } else if (isCompleted) {
        statusText = 'Completed';
        statusColor = 'bg-gray-100 text-gray-800';
    }

    return (
        <div className="bg-white rounded-xl shadow-md border-l-4 border-green-500 overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                        {statusText}
                    </span>
                    <span className="text-xs text-gray-400">ID: {donation._id.slice(-4)}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-1">{donation.foodType}</h3>
                <p className="text-sm text-gray-500 mb-4">{donation.quantity}</p>

                {/* OTP Display Section: Show Recipient OTP (deliveryOtp) */}
                {(isAssigned || isPicked) && donation.otps?.recipientOtp && (
                    <div className="bg-green-50 rounded-lg p-4 mb-2 border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-green-800 flex items-center">
                                <FaLock className="mr-2" /> Delivery OTP
                            </span>
                            <span className="text-xs text-gray-500">Give to volunteer at delivery</span>
                        </div>
                        <div className="text-center">
                            <span className="text-2xl font-mono font-bold tracking-widest text-green-700">
                                {donation.otps.recipientOtp}
                            </span>
                        </div>
                    </div>
                )}

                {/* Fallback for legacy data (if deliveryOtp exists flat) */}
                {(isAssigned || isPicked) && donation.deliveryOtp && !donation.otps && (
                    <div className="bg-green-50 rounded-lg p-4 mb-2 border border-green-100">
                        <div className="text-center">
                            <span className="text-2xl font-mono font-bold tracking-widest text-green-700">
                                {donation.deliveryOtp}
                            </span>
                        </div>
                    </div>
                )}


                {isRequested && !isAssigned && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-sm text-gray-500 italic">
                            Your request is visible to volunteers.
                        </p>
                    </div>
                )}

                {isDelivered && (
                    <div className="space-y-3">
                        <div className="text-center text-gray-500 text-sm py-2">
                            <FaCheckCircle className="inline mr-2 text-green-500" />
                            Food Delivered! Please confirm.
                        </div>
                        <button
                            onClick={onConfirm}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow transition-all"
                        >
                            Confirm Delivery
                        </button>
                    </div>
                )}

                {isCompleted && (
                    <div className="text-center text-gray-500 text-sm py-2">
                        <FaCheckCircle className="inline mr-2 text-gray-500" />
                        Order Closed.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecipientDashboard;
