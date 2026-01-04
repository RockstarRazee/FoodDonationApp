import { useState, useEffect } from 'react';
import { getAdminStats, getAdminAnalytics } from '../../services/api';
import { FaUsers, FaBoxOpen, FaTruck, FaCheckCircle, FaExclamationTriangle, FaClock, FaChartPie, FaChartLine } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const AdminOverview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0, activeUsers: 0, totalDonations: 0, completed: 0,
        pending: 0, expired: 0, successRate: 0, avgDeliveryTime: '-'
    });
    const [analytics, setAnalytics] = useState({ dailyActivity: [], statusDistribution: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Live update every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, analyticsRes] = await Promise.all([
                getAdminStats(),
                getAdminAnalytics()
            ]);
            setStats(statsRes.data);
            setAnalytics(analyticsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            setLoading(false);
        }
    };

    const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#6366F1']; // Emerald, Amber, Blue, Red, Indigo

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Users"
                    value={stats.totalUsers}
                    subtext={`${stats.activeUsers} active this week`}
                    icon={FaUsers}
                    color="bg-blue-500"
                />
                <StatCard
                    label="Total Donations"
                    value={stats.totalDonations}
                    subtext={`${stats.completed} delivered`}
                    icon={FaBoxOpen}
                    color="bg-emerald-500"
                />
                <StatCard
                    label="Success Rate"
                    value={`${stats.successRate}%`}
                    subtext={`${stats.expired} expired`}
                    icon={FaChartLine}
                    color={stats.successRate > 80 ? "bg-green-600" : "bg-yellow-500"}
                />
                <StatCard
                    label="Avg Delivery Time"
                    value={stats.avgDeliveryTime}
                    subtext="Performance metric"
                    icon={FaClock}
                    color="bg-purple-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Distribution (Donut) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <FaChartPie className="mr-2 text-gray-400" /> Donation Status
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Activity (Line) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <FaChartLine className="mr-2 text-gray-400" /> 7-Day Activity
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.dailyActivity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <ChartTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Status Bar */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl flex flex-wrap justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">System Health: Excellent</h2>
                    <p className="text-gray-400">All systems operational. {stats.pending} orders currently pending.</p>
                </div>
                <div className="relative z-10 mt-4 md:mt-0 flex space-x-8">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-400">{stats.completed}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Completed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-amber-400">{stats.pending}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Pending</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-red-400">{stats.expired}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Expired</p>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                    <FaBoxOpen size={200} />
                </div>
            </div>
        </div>
    );
};

// Reusable KPI Card
const StatCard = ({ label, value, subtext, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                <Icon className={`text-xl ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
        {/* Hover Effect */}
        <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
    </div>
);

export default AdminOverview;
