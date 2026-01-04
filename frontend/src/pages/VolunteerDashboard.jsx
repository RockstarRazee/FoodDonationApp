import { useState, useEffect } from 'react';
import { getNearbyDonations, assignDonation, updateDonationStatus, getMyDonations } from '../services/api';
import { socket } from '../services/socket';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaBox, FaClock, FaCheckCircle, FaTruck, FaTimes } from 'react-icons/fa';

const VolunteerDashboard = () => {
    // Helper: Calculate Distance using Haversine Formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;

        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d.toFixed(1);
    };

    // Helper: Get Google Maps Navigation URL
    const getNavUrl = (lat, lng) => {
        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    };

    const [activeTab, setActiveTab] = useState('available');
    const [availableDonations, setAvailableDonations] = useState([]);
    const [myDeliveries, setMyDeliveries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [otpInputs, setOtpInputs] = useState({});

    // Claim Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [pickupDeadline, setPickupDeadline] = useState('');
    const [deliveryDeadline, setDeliveryDeadline] = useState('');

    // Location state
    const [location, setLocation] = useState(null); // Volunteer's location

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
                    console.log("Location access denied or failed", error);
                    toast.error("Please enable location services for distance calculations");
                    // Fallback to a default location if access is denied
                    setLocation({ lat: 12.9716, lon: 77.5946 });
                }
            );
        } else {
            // Fallback to a default location if geolocation is not supported
            setLocation({ lat: 12.9716, lon: 77.5946 });
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'available') {
            fetchNearby();
        } else {
            fetchMyTasks();
        }
    }, [activeTab, location]); // Keep location dependency to refetch if location changes

    useEffect(() => {
        const handleUpdate = () => {
            // Refresh ALL data to keep both tabs in sync
            fetchNearby();
            fetchMyTasks();
        };

        socket.on('donationCreated', handleUpdate);
        socket.on('donationUpdated', handleUpdate);

        return () => {
            socket.off('donationCreated', handleUpdate);
            socket.off('donationUpdated', handleUpdate);
        };
    }, [location]); // Removed activeTab dependency to prevent double fetching logic, but fetching on mount handles init.

    const fetchNearby = async () => {
        setLoading(true);
        try {
            // Use current location or default for fetching
            const lat = location?.lat || 12.9716;
            const lon = location?.lon || 77.5946;
            const { data } = await getNearbyDonations(lat, lon, 5000000);
            // Available donations are those 'posted' OR 'requested'
            // But if we strictly follow Plan, Volunteer accepts 'requested' ones.
            // We will show 'requested' ones as "Ready to Accept" and maybe 'posted' as "Waiting for Request"? 
            // For simplicity and user plan, let's show all that are claimable.
            // Backend `getNearbyDonations` now returns 'posted' and 'requested'.
            setAvailableDonations(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch nearby donations');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTasks = async () => {
        setLoading(true);
        try {
            const { data } = await getMyDonations();
            setMyDeliveries(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openClaimModal = (donation) => {
        setSelectedDonation(donation);
        // Default deadlines for convenience
        const now = new Date();
        const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
        const twoHours = new Date(now.getTime() + 120 * 60 * 1000);
        // Adjust for timezone offset for input[type="datetime-local"]
        const toLocalISO = (date) => {
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offset).toISOString().slice(0, 16);
        };

        setPickupDeadline(toLocalISO(oneHour));
        setDeliveryDeadline(toLocalISO(twoHours));
        setIsModalOpen(true);
    };

    const handleClaimDisconnect = () => {
        setIsModalOpen(false);
        setSelectedDonation(null);
    };

    const handleConfirmClaim = async () => {
        if (!selectedDonation) return;

        try {
            await assignDonation(selectedDonation._id, {
                pickupDeadline,
                deliveryDeadline
            });
            toast.success('Donation claimed successfully!');
            handleClaimDisconnect();
            fetchNearby();
            setActiveTab('tasks');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const otp = otpInputs[id];
        if (!otp) return toast.error('Please enter OTP');

        try {
            await updateDonationStatus(id, status, otp);
            toast.success(`Status updated to ${status}`);
            setOtpInputs(prev => ({ ...prev, [id]: '' }));
            fetchMyTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 mb-8">
                Volunteer Dashboard
            </h1>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('available')}
                    className={`pb-4 px-4 text-lg font-medium transition-all ${activeTab === 'available'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Available Orders
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-4 px-4 text-lg font-medium transition-all ${activeTab === 'tasks'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    My Deliveries
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'available' ? (
                        availableDonations.length === 0 ? (
                            <p className="col-span-full text-center text-gray-500 py-12">No orders available nearby.</p>
                        ) : (
                            availableDonations.map(donation => (
                                <DonationCard
                                    key={donation._id}
                                    donation={donation}
                                    volunteerLocation={location}
                                    onClaim={() => openClaimModal(donation)}
                                />
                            ))
                        )
                    ) : (
                        myDeliveries.length === 0 ? (
                            <p className="col-span-full text-center text-gray-500 py-12">No active deliveries.</p>
                        ) : (
                            myDeliveries.map(donation => (
                                <DeliveryCard
                                    key={donation._id}
                                    donation={donation}
                                    otpInput={otpInputs[donation._id] || ''}
                                    setOtpInput={(val) => setOtpInputs(prev => ({ ...prev, [donation._id]: val }))}
                                    onUpdate={(status) => handleStatusUpdate(donation._id, status)}
                                    getNavUrl={getNavUrl}
                                />
                            ))
                        )
                    )}
                </div>
            )}

            {/* Claim Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Accept Delivery</h3>
                            <button onClick={handleClaimDisconnect} className="text-gray-500 hover:text-gray-700">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg mb-6">
                            <h4 className="font-semibold text-blue-800 text-sm mb-2">Order Details</h4>
                            <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Food:</span> {selectedDonation?.foodType}</p>
                            <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Expiry:</span> {new Date(selectedDonation?.expiryDate).toLocaleString()}</p>
                            {/* Show calculated distances in modal too */}
                            {location && selectedDonation?.location?.coordinates && (
                                <p className="text-xs text-gray-600 mb-1">
                                    <span className="font-medium">Pickup Dist:</span> {calculateDistance(location.lat, location.lon, selectedDonation.location.coordinates[1], selectedDonation.location.coordinates[0])} km
                                </p>
                            )}
                            {location && selectedDonation?.recipientLocation?.coordinates && (
                                <p className="text-xs text-gray-600 mb-1">
                                    <span className="font-medium">Dropoff Dist (from Donor):</span> {calculateDistance(
                                        selectedDonation.location.coordinates[1], selectedDonation.location.coordinates[0],
                                        selectedDonation.recipientLocation.coordinates[1], selectedDonation.recipientLocation.coordinates[0]
                                    )} km
                                </p>
                            )}
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Deadline</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={pickupDeadline}
                                    onChange={(e) => setPickupDeadline(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">When will you pick this up?</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Deadline</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={deliveryDeadline}
                                    onChange={(e) => setDeliveryDeadline(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">When will you deliver it? (Must be before expiry)</p>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmClaim}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                        >
                            Confirm Acceptance
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DonationCard = ({ donation, onClaim, volunteerLocation }) => {
    // Helper: Calculate Distance using Haversine Formula (duplicated for component independence, or could be passed as prop)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;

        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d.toFixed(1);
    };

    // Calculate distances
    let pickupDist = null;
    let deliveryDist = null;

    if (volunteerLocation && donation.location?.coordinates) {
        pickupDist = calculateDistance(volunteerLocation.lat, volunteerLocation.lon, donation.location.coordinates[1], donation.location.coordinates[0]);
    }

    if (donation.location?.coordinates && donation.recipientLocation?.coordinates) {
        deliveryDist = calculateDistance(
            donation.location.coordinates[1], donation.location.coordinates[0],
            donation.recipientLocation.coordinates[1], donation.recipientLocation.coordinates[0]
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${donation.status === 'requested' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {donation.status === 'requested' ? 'REQUESTED' : 'AVAILABLE'}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                        <FaClock className="mr-1" />
                        {new Date(donation.expiryDate).toLocaleDateString()}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">{donation.foodType}</h3>

                <div className="space-y-2 mb-6">
                    <div className="flex items-center text-gray-600">
                        <FaBox className="mr-3 text-blue-400" />
                        <span>{donation.quantity}</span>
                    </div>
                    <div className="flex items-start text-gray-600">
                        <FaMapMarkerAlt className="mr-3 mt-1 text-red-400" />
                        <span className="text-sm line-clamp-2">{donation.location?.address || 'Location provided'}</span>
                    </div>

                    {/* Distance display */}
                    {pickupDist && (
                        <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            <span className="mr-2">📍 From You:</span>
                            <span className="text-blue-600">{pickupDist} km</span>
                        </div>
                    )}
                    {deliveryDist && (
                        <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            <span className="mr-2">🏁 Delivery Dist:</span>
                            <span className="text-purple-600">{deliveryDist} km</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClaim}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
                >
                    <FaCheckCircle className="mr-2" /> Accept Order
                </button>
            </div>
        </div>
    );
};

const DeliveryCard = ({ donation, otpInput, setOtpInput, onUpdate, getNavUrl }) => {
    const isAssigned = donation.status === 'assigned';
    const isPicked = donation.status === 'picked';
    const isDelivered = donation.status === 'delivered';
    const isCompleted = donation.status === 'completed';

    const getStatusColor = () => {
        if (isAssigned) return 'bg-yellow-100 text-yellow-800';
        if (isPicked) return 'bg-blue-100 text-blue-800';
        if (isDelivered) return 'bg-purple-100 text-purple-800';
        if (isCompleted) return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="bg-white rounded-xl shadow-md border-l-4 border-blue-500 overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor()}`}>
                        {donation.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">ID: {donation._id.slice(-4)}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-1">{donation.foodType}</h3>
                <p className="text-sm text-gray-500 mb-4">{donation.quantity}</p>

                {/* Navigation Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {/* Navigate to Donor (Show if Assigned) */}
                    {(isAssigned) && donation.location?.coordinates && (
                        <a
                            href={getNavUrl(donation.location.coordinates[1], donation.location.coordinates[0])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
                        >
                            <FaTruck className="mr-2" /> To Donor
                        </a>
                    )}

                    {/* Navigate to Recipient (Show if Picked/Assigned and loc exists) */}
                    {(isAssigned || isPicked) && donation.recipientLocation?.coordinates && (
                        <a
                            href={getNavUrl(donation.recipientLocation.coordinates[1], donation.recipientLocation.coordinates[0])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 transition text-sm font-semibold"
                        >
                            <FaMapMarkerAlt className="mr-2" /> To Recipient
                        </a>
                    )}
                </div>

                {/* Deadlines Display */}
                {donation.volunteerCommitment && (
                    <div className="mb-4 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <p>Pickup By: {new Date(donation.volunteerCommitment.pickupDeadline).toLocaleString()}</p>
                        <p>Deliver By: {new Date(donation.volunteerCommitment.deliveryDeadline).toLocaleString()}</p>
                    </div>
                )}

                {!isDelivered && !isCompleted && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            {isAssigned ? 'Pickup Verification' : 'Delivery Verification'}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                            {isAssigned ? 'Ask Donor for OTP' : 'Ask Recipient for OTP'}
                        </p>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                placeholder="Enter OTP"
                                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                maxLength={6}
                            />
                            <button
                                onClick={() => onUpdate(isAssigned ? 'picked' : 'delivered')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Verify
                            </button>
                        </div>
                    </div>
                )}

                {isDelivered && !isCompleted && (
                    <div className="text-center text-gray-500 text-sm py-2 bg-purple-50 rounded-lg">
                        <FaCheckCircle className="inline mr-2 text-purple-500" />
                        Delivered! Waiting for recipient confirmation.
                    </div>
                )}

                {isCompleted && (
                    <div className="text-center text-gray-500 text-sm py-2">
                        <FaCheckCircle className="inline mr-2 text-green-500" />
                        Completed & Verified
                    </div>
                )}
            </div>
        </div>
    );
};

export default VolunteerDashboard;

