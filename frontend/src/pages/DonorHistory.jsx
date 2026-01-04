import { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FaLock, FaUser } from 'react-icons/fa';

const DonorHistory = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fetchDonations();

        const handleUpdate = () => {
            fetchDonations();
        };

        socket.on('donationUpdated', handleUpdate);

        return () => {
            socket.off('donationUpdated', handleUpdate);
        };
    }, []);

    const fetchDonations = async () => {
        try {
            const { data } = await api.get('/donations/my');
            setDonations(data);
        } catch (error) {
            toast.error('Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'posted': return 'bg-gray-100 text-gray-600';
            case 'requested': return 'bg-purple-100 text-purple-600';
            case 'assigned': return 'bg-blue-100 text-blue-600';
            case 'picked': return 'bg-orange-100 text-orange-600';
            case 'delivered': return 'bg-green-100 text-green-600';
            case 'completed': return 'bg-green-200 text-green-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 flex justify-center pt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">My Donations</h1>

                {donations.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <p className="text-gray-500 mb-4">You haven't donated yet.</p>
                        <a href="/donate" className="text-purple-600 font-medium hover:underline">Start by adding food</a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {donations.map((donation) => (
                            <div key={donation._id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-800">{donation.foodType}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(donation.status)}`}>
                                        {donation.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p>Quantity: <span className="font-medium">{donation.quantity}</span></p>
                                    <p>Expires: {new Date(donation.expiryDate).toLocaleDateString()} {new Date(donation.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p>Posted: {new Date(donation.createdAt).toLocaleDateString()}</p>

                                    {donation.volunteer && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-center text-blue-600 bg-blue-50 p-3 rounded-lg mb-2">
                                                <FaUser className="mr-2" />
                                                <div className="flex-1">
                                                    <span className="text-xs font-semibold block">VOLUNTEER ASSIGNED</span>
                                                    <span className="text-sm font-bold block">{donation.volunteer.name}</span>
                                                    {donation.volunteerCommitment && (
                                                        <span className="text-xs text-blue-500 block">
                                                            Coming by: {new Date(donation.volunteerCommitment.pickupDeadline).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Show OTP only if Assigned (waiting for pickup) */}
                                            {donation.status === 'assigned' && (
                                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-bold text-yellow-800 block uppercase">Pickup OTP</span>
                                                        <span className="text-xs text-yellow-600">Give this to volunteer</span>
                                                    </div>
                                                    <div className="text-xl font-mono font-bold text-yellow-700 tracking-wider">
                                                        {donation.otps?.donorOtp || donation.pickupOtp}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DonorHistory;
