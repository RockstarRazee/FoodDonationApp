import { useState, useEffect } from 'react';
import { getRecipientDashboard, completeDonation } from '../../services/api';
import { socket } from '../../services/socket';
import { FaCheck, FaTruck, FaBox, FaUserClock, FaMapMarkerAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const RecipientRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    const fetchData = async () => {
        try {
            const { data } = await getRecipientDashboard();
            // Map timeline data to full donation objects if needed, or just use timelines if they have enough info
            // The API returns timelines array with donationId, status, timestamps, and foodType
            setRequests(data.timelines || []);
            setLoading(false);
        } catch (error) {
            console.error("Fetch Error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleUpdate = () => {
            fetchData();
        };

        socket.on('donationUpdated', handleUpdate);

        return () => {
            socket.off('donationUpdated', handleUpdate);
        };
    }, []);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const openConfirmModal = (id, e) => {
        e.stopPropagation();
        setConfirmModal({ isOpen: true, id });
    };

    const handleConfirmDelivery = async () => {
        try {
            await completeDonation(confirmModal.id);
            toast.success("Delivery confirmed! Thank you.");
            fetchData();
        } catch (error) {
            toast.error("Failed to confirm delivery.");
        } finally {
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    if (loading) return <div className="p-8 text-center">Loading requests...</div>;

    if (requests.length === 0) return (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-700">No Request History</h3>
            <p className="text-gray-500 mt-2">You haven't requested any donations yet.</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">


            {requests.map((req) => (
                <div key={req.donationId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Summary */}
                    <div
                        onClick={() => toggleExpand(req.donationId)}
                        className="p-6 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${getStatusColor(req.status)}`}>
                                <StatusIcon status={req.status} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{req.foodType}</h3>
                                <p className="text-sm text-gray-500">
                                    Posted on {new Date(req.timestamps.posted).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold capitalize text-gray-600 px-3 py-1 bg-gray-100 rounded-full">
                                {req.status}
                            </span>
                            {expandedId === req.donationId ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                        </div>
                    </div>

                    {/* Expandable Timeline */}
                    {expandedId === req.donationId && (
                        <div className="px-6 pb-6 pt-2 bg-gray-50/50 border-t border-gray-100">
                            <div className="space-y-6 ml-4 border-l-2 border-gray-200 pl-8 relative my-4">
                                <TimelineItem
                                    currentStatus={req.status}
                                    stepStatus="posted"
                                    label="Request Sent"
                                    timestamp={req.timestamps.posted}
                                />
                                <TimelineItem
                                    currentStatus={req.status}
                                    stepStatus="assigned"
                                    label="Volunteer Assigned"
                                    timestamp={req.timestamps.assigned}
                                />
                                <TimelineItem
                                    currentStatus={req.status}
                                    stepStatus="picked"
                                    label="Picked Up"
                                    timestamp={req.timestamps.picked}
                                />
                                {req.status === 'picked' && req.recipientOtp && (
                                    <div className="ml-8 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-fade-in relative z-20">
                                        <p className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">Share this OTP for Delivery</p>
                                        <p className="text-2xl font-mono font-bold text-gray-800 tracking-widest">{req.recipientOtp}</p>
                                    </div>
                                )}
                                <TimelineItem
                                    currentStatus={req.status}
                                    stepStatus="delivered"
                                    label="Arrived at Location"
                                    timestamp={req.timestamps.delivered}
                                />
                                <TimelineItem
                                    currentStatus={req.status}
                                    stepStatus="completed"
                                    label="Completed"
                                    timestamp={req.timestamps.completed}
                                    isLast
                                />
                            </div>

                            {req.status === 'delivered' && (
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={(e) => openConfirmModal(req.donationId, e)}
                                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-emerald-700 transition-colors flex items-center"
                                    >
                                        <FaCheck className="mr-2" /> Confirm Receipt
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmDelivery}
                title="Confirm Delivery Receipt"
                message="Are you sure you want to confirm that you have received this food donation? This action completes the donation process."
                confirmText="Yes, Received"
            />
        </div>
    );
};

const TimelineItem = ({ currentStatus, stepStatus, label, timestamp, isLast }) => {
    const isCompleted = getStepOrder(currentStatus) >= getStepOrder(stepStatus);
    const isCurrent = currentStatus === stepStatus;

    return (
        <div className="relative">
            {/* Dot */}
            <div className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 z-10 transition-colors duration-500
                ${isCompleted ? 'bg-emerald-500 border-white shadow-md' : 'bg-gray-300 border-white'}
                ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}
            `}></div>

            <div className={`transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                <h4 className={`font-bold ${isCurrent ? 'text-emerald-700' : 'text-gray-700'}`}>{label}</h4>
                {timestamp && (
                    <p className="text-xs text-gray-500">
                        {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </div>
        </div>
    );
};

const getStepOrder = (status) => {
    const steps = ['posted', 'requested', 'assigned', 'picked', 'delivered', 'completed'];
    return steps.indexOf(status);
};

const getStatusColor = (status) => {
    switch (status) {
        case 'completed': return 'bg-emerald-100 text-emerald-600';
        case 'active': return 'bg-blue-100 text-blue-600';
        default: return 'bg-gray-100 text-gray-500';
    }
};

const StatusIcon = ({ status }) => {
    switch (status) {
        case 'assigned': return <FaUserClock />;
        case 'picked': return <FaTruck />;
        case 'delivered': return <FaMapMarkerAlt />;
        case 'completed': return <FaCheck />;
        default: return <FaBox />;
    }
};

export default RecipientRequests;
