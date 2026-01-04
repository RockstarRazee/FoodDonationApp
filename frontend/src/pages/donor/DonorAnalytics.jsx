import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { FaLeaf, FaHandHoldingHeart, FaTruck, FaClock, FaUsers, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../services/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const COLORS = ['#10B981', '#F59E0B', '#6366F1', '#EC4899', '#EF4444'];

const DonorAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await api.get('/donations/my/analytics');
            console.log("Fetched Analytics:", res.data);
            setData(res.data);
        } catch (error) {
            console.error("Error fetching analytics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const socket = io('http://localhost:5000');
        socket.on('donationUpdated', () => {
            fetchData();
            toast.success("Analytics updated!", { icon: '📊', position: 'bottom-right' });
        });
        socket.on('donationCreated', () => {
            fetchData();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
    );

    if (!data) return <div className="p-8 text-center text-gray-500">No analytics data available.</div>;

    const { summary, statusBreakdown, timeline, volunteerPerformance } = data;

    // Prepare Chart Data
    const radialData = [
        { name: 'Completed', count: statusBreakdown.completed || 0, fill: '#10B981' },
        { name: 'Delivered', count: statusBreakdown.delivered || 0, fill: '#34D399' },
        { name: 'Active', count: (statusBreakdown.posted + statusBreakdown.assigned + statusBreakdown.picked) || 0, fill: '#F59E0B' },
        { name: 'Expired', count: statusBreakdown.expired || 0, fill: '#EF4444' }
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Section 1: Hero Impact Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FaLeaf className="text-9xl text-green-600" />
                </div>
                <div className="relative z-10 text-left">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
                        You've helped feed <span className="text-green-600">{summary.peopleHelped} people</span> 🌱
                    </h1>
                    <p className="text-gray-600 max-w-xl">
                        Thank you for your incredible contribution to reducing food waste. Every meal you donate makes a real difference in someone's life.
                    </p>
                </div>
            </div>

            {/* Section 2: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Donations"
                    value={summary.totalDonations}
                    icon={<FaHandHoldingHeart />}
                    color="bg-blue-50 text-blue-600"
                />
                <KPICard
                    title="Completed"
                    value={summary.completed}
                    icon={<FaCheckCircle />}
                    color="bg-green-50 text-green-600"
                />
                <KPICard
                    title="Avg Pickup Time"
                    value={`${summary.avgPickupTime}m`}
                    sub="from assignment"
                    icon={<FaClock />}
                    color="bg-amber-50 text-amber-600"
                />
                <KPICard
                    title="Avg Delivery Time"
                    value={`${summary.avgDeliveryTime}m`}
                    sub="from pickup"
                    icon={<FaTruck />}
                    color="bg-purple-50 text-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section 3: Donation Journey (Radial) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 w-full">Impact Breakdown</h3>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={radialData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {radialData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Section 4: Contribution Over Time */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Your Contribution History</h3>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="donations" stroke="#10B981" fillOpacity={1} fill="url(#colorDonations)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Section 5: Volunteer Interaction Insights */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Volunteer Heroes</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">People who handled your food</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pb-3 text-sm font-medium text-gray-400">Volunteer</th>
                                <th className="pb-3 text-sm font-medium text-gray-400">Deliveries</th>
                                <th className="pb-3 text-sm font-medium text-gray-400">Impact</th>
                                <th className="pb-3 text-sm font-medium text-gray-400">Badge</th>
                            </tr>
                        </thead>
                        <tbody>
                            {volunteerPerformance.map((vol, index) => (
                                <tr key={index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 font-medium text-gray-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                            {vol.name.charAt(0)}
                                        </div>
                                        {vol.name}
                                    </td>
                                    <td className="py-4 text-gray-600">{vol.deliveries}</td>
                                    <td className="py-4 text-gray-600">Helped deliver {vol.deliveries} meals</td>
                                    <td className="py-4">
                                        {vol.deliveries > 5 ? (
                                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full border border-yellow-200">⭐ Super Star</span>
                                        ) : (
                                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full border border-blue-200">👍 Reliable</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {volunteerPerformance.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-400 italic">No volunteer interactions yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Helper Component for KPI Cards
const KPICard = ({ title, value, icon, color, sub }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
        <div className={`p-4 rounded-full ${color} text-xl`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    </div>
);

export default DonorAnalytics;
