import { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import { getVolunteerDashboard, updateDonationStatus, generateDonationOtp } from '../../services/api';
import { FaTruck, FaBoxOpen, FaCheckCircle, FaMapMarkedAlt, FaKey, FaArrowRight, FaPhone } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { socket } from '../../services/socket';

const VolunteerDeliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [otpInputs, setOtpInputs] = useState({});
    const [processing, setProcessing] = useState({}); // { [id]: 'action' }

    const fetchData = async () => {
        try {
            const { data } = await getVolunteerDashboard();
            setDeliveries(data.activeDeliveries);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handleUpdate = () => fetchData();
        socket.on('donationUpdated', handleUpdate);
        return () => socket.off('donationUpdated', handleUpdate);
    }, []);

    const handleNavigate = (loc) => {
        // [lng, lat]
        const [lng, lat] = loc.coordinates;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    const handleVerify = async (id, status, expectedStatus) => {
        const otp = otpInputs[id] || '';
        if (!otp) {
            toast.error("Please enter the OTP");
            return;
        }

        setProcessing(prev => ({ ...prev, [id]: 'verify' }));
        try {
            await updateDonationStatus(id, expectedStatus, otp);
            toast.success(`Status updated to ${expectedStatus.toUpperCase()}!`);
            setOtpInputs(prev => ({ ...prev, [id]: '' }));
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Verification Failed");
        } finally {
            setProcessing(prev => { const n = { ...prev }; delete n[id]; return n; });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading mission data...</div>;

    if (deliveries.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="bg-gray-100 p-6 rounded-full text-gray-400 text-4xl"><FaTruck /></div>
            <h2 className="text-xl font-bold text-gray-700">No Active Deliveries</h2>
            <p className="text-gray-500">Go to "Available Orders" to start a mission.</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">


            {deliveries.map(delivery => {
                const isPicked = delivery.status === 'picked';
                const isAssigned = delivery.status === 'assigned';
                const nextStep = isAssigned ? 'Pickup' : 'Delivery';

                const hasPickupOtp = delivery.pickupOtp && delivery.pickupOtp.generatedAt;
                const hasDeliveryOtp = delivery.deliveryOtp && delivery.deliveryOtp.generatedAt;

                const handleTriggerOtp = async (id, type) => {
                    setProcessing(prev => ({ ...prev, [id]: `otp-${type}` }));
                    try {
                        await generateDonationOtp(id, type);
                        toast.success(`${type === 'pickup' ? 'Pickup' : 'Delivery'} OTP sent to ${type === 'pickup' ? 'Donor' : 'Recipient'}!`);
                        fetchData();
                    } catch (error) {
                        toast.error(error.response?.data?.message || "Failed to generate OTP");
                    } finally {
                        setProcessing(prev => { const n = { ...prev }; delete n[id]; return n; });
                    }
                };

                return (
                    <div key={delivery._id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
                        {/* Status Bar */}
                        <div className="h-2 bg-gray-100 w-full">
                            <div
                                className={`h-full transition-all duration-1000 ${isAssigned ? 'w-1/3 bg-blue-500' : 'w-2/3 bg-purple-500'}`}
                            ></div>
                        </div>

                        <div className="p-8">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                        {delivery.foodType}
                                        <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {delivery.status}
                                        </span>
                                    </h2>
                                    <p className="text-gray-500 flex items-center mt-1">
                                        <FaBoxOpen className="mr-2" /> {delivery.quantity}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next Deadline</p>
                                    <p className="text-xl font-mono font-bold text-red-500">
                                        {(isAssigned ? delivery.volunteerCommitment?.pickupDeadline : delivery.volunteerCommitment?.deliveryDeadline)
                                            ? new Date(isAssigned ? delivery.volunteerCommitment.pickupDeadline : delivery.volunteerCommitment.deliveryDeadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : <span className="text-sm text-gray-400">No Checkpoint</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Stepper / Content */}
                            <div className="grid md:grid-cols-2 gap-12 relative">
                                {/* Vertical Divider */}
                                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-100 -ml-px"></div>

                                {/* Step 1: Donor (Pickup) */}
                                <div className={`space-y-6 ${!isAssigned ? 'opacity-40 grayscale pointer-events-none' : ''} transition-all duration-500`}>
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-3 rounded-xl font-bold text-xl ${isAssigned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>1</div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Pickup from Donor</h3>
                                            <p className="text-sm text-gray-500">
                                                {!hasPickupOtp ? "Arrive and request OTP from donor." : "Enter OTP provided by donor."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <p className="font-bold text-gray-800 mb-1">{delivery.donor?.name || "Unknown Donor"}</p>
                                        <p className="text-sm text-gray-600 mb-2 truncate">{delivery.location?.address}</p>
                                        <p className="text-sm text-gray-500 flex items-center"><FaPhone className="mr-2 scale-x-[-1]" /> {delivery.donor?.phone || "N/A"}</p>
                                    </div>

                                    {isAssigned && (
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => handleNavigate(delivery.location || { coordinates: [0, 0] })}
                                                className="w-full py-3 border-2 border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center"
                                            >
                                                <FaMapMarkedAlt className="mr-2" /> Navigate to Donor
                                            </button>

                                            {!hasPickupOtp ? (
                                                <Button
                                                    onClick={() => handleTriggerOtp(delivery._id, 'pickup')}
                                                    isLoading={processing[delivery._id] === 'otp-pickup'}
                                                    variant="blue"
                                                    className="w-full py-3"
                                                >
                                                    <FaBoxOpen className="mr-2" /> Food Received (Generate OTP)
                                                </Button>
                                            ) : (
                                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
                                                    <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Enter Donor OTP</label>
                                                    <div className="flex space-x-2">
                                                        <input
                                                            type="text"
                                                            placeholder="6-digit code"
                                                            className="flex-1 p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center tracking-widest text-lg"
                                                            maxLength="6"
                                                            value={otpInputs[delivery._id] || ''}
                                                            onChange={e => setOtpInputs({ ...otpInputs, [delivery._id]: e.target.value })}
                                                        />
                                                        <Button
                                                            onClick={() => handleVerify(delivery._id, 'assigned', 'picked')}
                                                            isLoading={processing[delivery._id] === 'verify'}
                                                            variant="blue"
                                                            className="px-6"
                                                        >
                                                            Verify
                                                        </Button>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-3 px-1">
                                                        <span className="text-xs text-blue-400 font-medium">OTP valid for 5 mins</span>
                                                        <button
                                                            onClick={() => handleTriggerOtp(delivery._id, 'pickup')}
                                                            disabled={processing[delivery._id] === 'otp-pickup'}
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors disabled:opacity-50"
                                                        >
                                                            {processing[delivery._id] === 'otp-pickup' ? 'Sending...' : 'Resend OTP'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: Recipient (Delivery) */}
                                <div className={`space-y-6 ${isAssigned ? 'opacity-40 grayscale pointer-events-none' : ''} transition-all duration-500`}>
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-3 rounded-xl font-bold text-xl ${isPicked ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>2</div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Deliver to Recipient</h3>
                                            <p className="text-sm text-gray-500">
                                                {!hasDeliveryOtp ? "Arrive and request OTP from recipient." : "Enter OTP provided by recipient."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <p className="font-bold text-gray-800 mb-1">{delivery.recipient?.name || "Recipient"}</p>
                                        <p className="text-sm text-gray-600 mb-2 truncate">{delivery.recipientLocation?.address || "Address pending"}</p>
                                        <p className="text-sm text-gray-500 flex items-center"><FaPhone className="mr-2 scale-x-[-1]" /> {delivery.recipient?.phone || "N/A"}</p>
                                    </div>

                                    {isPicked && (
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => handleNavigate(delivery.recipientLocation || { coordinates: [0, 0] })}
                                                className="w-full py-3 border-2 border-purple-500 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center"
                                            >
                                                <FaMapMarkedAlt className="mr-2" /> Navigate to Recipient
                                            </button>

                                            {!hasDeliveryOtp ? (
                                                <Button
                                                    onClick={() => handleTriggerOtp(delivery._id, 'delivery')}
                                                    isLoading={processing[delivery._id] === 'otp-delivery'}
                                                    variant="purple"
                                                    className="w-full py-3"
                                                >
                                                    <FaCheckCircle className="mr-2" /> Delivery Completed (Generate OTP)
                                                </Button>
                                            ) : (
                                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-fade-in">
                                                    <label className="block text-xs font-bold text-purple-800 uppercase mb-2">Enter Recipient OTP</label>
                                                    <div className="flex space-x-2">
                                                        <input
                                                            type="text"
                                                            placeholder="6-digit code"
                                                            className="flex-1 p-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-center tracking-widest text-lg"
                                                            maxLength="6"
                                                            value={otpInputs[delivery._id] || ''}
                                                            onChange={e => setOtpInputs({ ...otpInputs, [delivery._id]: e.target.value })}
                                                        />
                                                        <Button
                                                            onClick={() => handleVerify(delivery._id, 'picked', 'delivered')}
                                                            isLoading={processing[delivery._id] === 'verify'}
                                                            variant="purple"
                                                            className="px-6"
                                                        >
                                                            Complete
                                                        </Button>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-3 px-1">
                                                        <span className="text-xs text-purple-400 font-medium">OTP valid for 5 mins</span>
                                                        <button
                                                            onClick={() => handleTriggerOtp(delivery._id, 'delivery')}
                                                            disabled={processing[delivery._id] === 'otp-delivery'}
                                                            className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline transition-colors disabled:opacity-50"
                                                        >
                                                            {processing[delivery._id] === 'otp-delivery' ? 'Sending...' : 'Resend OTP'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default VolunteerDeliveries;
