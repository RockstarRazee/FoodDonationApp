import { useState, useEffect } from 'react';
import { getMyDonations } from '../../services/api';
import { socket } from '../../services/socket';
import { FaSearch, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaPhone, FaKey, FaCheckCircle, FaClipboardList, FaUser, FaTruck, FaBoxOpen, FaClock, FaUsers } from 'react-icons/fa';

const DonorDonations = () => {
    const [donations, setDonations] = useState([]);
    const [filteredDonations, setFilteredDonations] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchDonations();

        // Debug Socket Connection
        socket.on('connect', () => console.log('🟢 Socket Connected:', socket.id));
        socket.on('disconnect', () => console.log('🔴 Socket Disconnected'));

        const handleUpdate = (data) => {
            console.log('⚡ Real-time update received:', data);

            // Optimistic Update for OTP
            if (data && data.otp && data.donationId) {
                setDonations(prev => prev.map(d => {
                    if (d._id === data.donationId) {
                        return {
                            ...d,
                            pickupOtp: { ...d.pickupOtp, code: data.otp, verified: false } // Assuming pickup for now, or check type if passed
                        };
                    }
                    return d;
                }));
            }

            // Always refetch to ensure full consistency
            fetchDonations();
        };

        socket.on('donationUpdated', handleUpdate);
        socket.on('pickupOtpGenerated', handleUpdate);

        return () => {
            socket.off('donationUpdated', handleUpdate);
            socket.off('pickupOtpGenerated', handleUpdate);
            socket.off('connect');
            socket.off('disconnect');
        };
    }, []);

    useEffect(() => {
        filterData();
    }, [search, statusFilter, donations]);

    const fetchDonations = async () => {
        try {
            const { data } = await getMyDonations();
            console.log("Fetched Donations:", data);
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
                d.foodType.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFilteredDonations(temp);
    };

    const stats = {
        total: donations.length,
        completed: donations.filter(d => ['completed', 'delivered'].includes(d.status)).length,
        active: donations.filter(d => ['posted', 'requested', 'assigned', 'picked'].includes(d.status)).length,
        peopleHelped: donations.filter(d => ['completed', 'delivered'].includes(d.status)).length
    };

    const toggleRow = (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your donations...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Donations</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.total}</h3>
                        <p className="text-xs text-blue-500 font-medium mt-1">Lifetime contribution</p>
                    </div>
                    <div className="p-4 bg-blue-500 rounded-2xl text-white text-xl shadow-lg shadow-blue-200">
                        <FaBoxOpen />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Completed Deliveries</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.completed}</h3>
                        <p className="text-xs text-emerald-500 font-medium mt-1">Successfully delivered</p>
                    </div>
                    <div className="p-4 bg-emerald-500 rounded-2xl text-white text-xl shadow-lg shadow-emerald-200">
                        <FaCheckCircle />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Active Donations</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.active}</h3>
                        <p className="text-xs text-orange-500 font-medium mt-1">Currently in progress</p>
                    </div>
                    <div className="p-4 bg-orange-500 rounded-2xl text-white text-xl shadow-lg shadow-orange-200">
                        <FaClock />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">People Helped</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.peopleHelped}</h3>
                        <p className="text-xs text-purple-500 font-medium mt-1">Estimated impact</p>
                    </div>
                    <div className="p-4 bg-purple-500 rounded-2xl text-white text-xl shadow-lg shadow-purple-200">
                        <FaUsers />
                    </div>
                </div>
            </div>

            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative w-full md:w-96">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search food type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                </div>
                <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'posted', 'assigned', 'completed'].map(status => (
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
                                <th className="px-6 py-4 font-semibold">Quantity</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Volunteer</th>
                                <th className="px-6 py-4 font-semibold">Recipient</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDonations.map(donation => (
                                <>
                                    <tr
                                        key={donation._id}
                                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${expandedRow === donation._id ? 'bg-blue-50' : ''}`}
                                        onClick={() => toggleRow(donation._id)}
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {donation.foodType}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {donation.quantity}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={donation.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {donation.volunteer ? donation.volunteer.name : <span className="text-gray-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {donation.recipient ? donation.recipient.name : <span className="text-gray-400 italic">Not Assigned</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(donation.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {expandedRow === donation._id ? <FaChevronUp /> : <FaChevronDown />}
                                        </td>
                                    </tr>
                                    {/* Expanded Row */}
                                    {expandedRow === donation._id && (
                                        <tr className="bg-gray-50 border-t border-gray-100 transition-all duration-300">
                                            <td colSpan="7" className="px-6 py-8">
                                                <div className="flex flex-col space-y-8 animate-fade-in">
                                                    {/* 1. Horizontal Timeline */}
                                                    <div className="w-full px-2">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Order Progress</h4>

                                                        <div className="relative mb-12">
                                                            {/* Progress Bar Background */}
                                                            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 -translate-y-1/2 rounded-full -z-0"></div>

                                                            {/* Active Progress Bar */}
                                                            <div
                                                                className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full -z-0 transition-all duration-1000 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 shadow-sm"
                                                                style={{
                                                                    width: donation.status === 'completed' || donation.status === 'delivered' ? '100%'
                                                                        : donation.status === 'picked' ? '66%'
                                                                            : donation.status === 'assigned' ? '33%'
                                                                                : '0%'
                                                                }}
                                                            ></div>

                                                            <div className="flex justify-between relative z-10 w-full">
                                                                {/* Step 1: Posted */}
                                                                <div className="flex flex-col items-center group cursor-default">
                                                                    <div className={`w-12 h-12 rounded-full border-[3px] shadow-sm flex items-center justify-center transition-all duration-300 bg-white ${donation.status ? 'border-blue-500 text-blue-600 scale-110' : 'border-gray-200 text-gray-300'}`}>
                                                                        <FaClipboardList className="text-lg" />
                                                                    </div>
                                                                    <div className="text-center absolute top-14 w-32 space-y-0.5">
                                                                        <p className="text-sm font-bold text-gray-800">Posted</p>
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                                                {new Date(donation.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400 mt-0.5">
                                                                                {new Date(donation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Step 2: Assigned */}
                                                                <div className="flex flex-col items-center group cursor-default">
                                                                    <div className={`w-12 h-12 rounded-full border-[3px] shadow-sm flex items-center justify-center transition-all duration-300 bg-white ${['assigned', 'picked', 'delivered', 'completed'].includes(donation.status) ? 'border-orange-500 text-orange-600 scale-110' : 'border-gray-200 text-gray-300'}`}>
                                                                        <FaUser className="text-lg" />
                                                                    </div>
                                                                    <div className="text-center absolute top-14 w-32 space-y-0.5">
                                                                        <p className={`text-sm font-bold transition-colors ${['assigned', 'picked', 'delivered', 'completed'].includes(donation.status) ? 'text-gray-800' : 'text-gray-400'}`}>Assigned</p>
                                                                        {['assigned', 'picked', 'delivered', 'completed'].includes(donation.status) && (
                                                                            <div className="flex flex-col items-center animate-fade-in">
                                                                                {donation.volunteer && <span className="text-[11px] font-medium text-orange-600 mb-0.5">@{donation.volunteer.name.split(' ')[0]}</span>}
                                                                                {(() => {
                                                                                    const dateToUse = donation.assignedAt || donation.updatedAt;
                                                                                    return dateToUse ? (
                                                                                        <>
                                                                                            <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                                                                {new Date(dateToUse).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                            </span>
                                                                                            <span className="text-[10px] text-gray-400 mt-0.5">
                                                                                                {new Date(dateToUse).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                            </span>
                                                                                        </>
                                                                                    ) : null;
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Step 3: Picked Up */}
                                                                <div className="flex flex-col items-center group cursor-default">
                                                                    <div className={`w-12 h-12 rounded-full border-[3px] shadow-sm flex items-center justify-center transition-all duration-300 bg-white ${['picked', 'delivered', 'completed'].includes(donation.status) ? 'border-purple-500 text-purple-600 scale-110' : 'border-gray-200 text-gray-300'}`}>
                                                                        <FaTruck className="text-lg" />
                                                                    </div>
                                                                    <div className="text-center absolute top-14 w-32 space-y-0.5">
                                                                        <p className={`text-sm font-bold transition-colors ${['picked', 'delivered', 'completed'].includes(donation.status) ? 'text-gray-800' : 'text-gray-400'}`}>Picked Up</p>
                                                                        {['picked', 'delivered', 'completed'].includes(donation.status) && (
                                                                            <div className="flex flex-col items-center animate-fade-in">
                                                                                {(() => {
                                                                                    const dateToUse = donation.pickedAt || donation.updatedAt;
                                                                                    return dateToUse ? (
                                                                                        <>
                                                                                            <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                                                                {new Date(dateToUse).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                            </span>
                                                                                            <span className="text-[10px] text-gray-400 mt-0.5">
                                                                                                {new Date(dateToUse).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                            </span>
                                                                                        </>
                                                                                    ) : null;
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Step 4: Delivered */}
                                                                <div className="flex flex-col items-center group cursor-default">
                                                                    <div className={`w-12 h-12 rounded-full border-[3px] shadow-sm flex items-center justify-center transition-all duration-300 bg-white ${['delivered', 'completed'].includes(donation.status) ? 'border-green-500 text-green-600 scale-110' : 'border-gray-200 text-gray-300'}`}>
                                                                        <FaCheckCircle className="text-lg" />
                                                                    </div>
                                                                    <div className="text-center absolute top-14 w-32 space-y-0.5">
                                                                        <p className={`text-sm font-bold transition-colors ${['delivered', 'completed'].includes(donation.status) ? 'text-gray-800' : 'text-gray-400'}`}>Delivered</p>
                                                                        {['delivered', 'completed'].includes(donation.status) && (
                                                                            <div className="flex flex-col items-center animate-fade-in">
                                                                                <span className="text-[11px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                                                    Completed
                                                                                </span>
                                                                                {(() => {
                                                                                    const dateToUse = donation.deliveredAt || donation.completedAt || donation.updatedAt;
                                                                                    return dateToUse ? (
                                                                                        <>
                                                                                            <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 mt-0.5">
                                                                                                {new Date(dateToUse).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                            </span>
                                                                                            <span className="text-[10px] text-gray-400 mt-0.5">
                                                                                                {new Date(dateToUse).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                            </span>
                                                                                        </>
                                                                                    ) : null;
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 2. Volunteer Info (Full Width Card) */}
                                                    {donation.volunteer && (
                                                        <div className="mt-12 md:mt-16">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Volunteer Details</h4>
                                                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                                                                <div className="flex items-center space-x-4">
                                                                    <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold">
                                                                        {donation.volunteer.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-800 text-lg">{donation.volunteer.name}</p>
                                                                        <div className="flex items-center text-sm text-gray-500">
                                                                            <FaPhone className="mr-2 text-gray-400" /> {donation.volunteer.phone || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {donation.status === 'assigned' && (
                                                                    <div className="flex flex-col items-center md:items-end">
                                                                        <span className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-2">Share Code with Volunteer</span>
                                                                        {donation.pickupOtp && donation.pickupOtp.code && !donation.pickupOtp.verified ? (
                                                                            <div className="px-6 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center shadow-inner animate-fade-in-up">
                                                                                <FaKey className="mr-3 text-amber-500 text-lg" />
                                                                                <span className="font-mono font-bold text-2xl text-gray-800 tracking-widest">{donation.pickupOtp.code}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center text-gray-400">
                                                                                <span className="text-sm italic">Waiting for volunteer to arrive...</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            {filteredDonations.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        No donations found.
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

export default DonorDonations;
