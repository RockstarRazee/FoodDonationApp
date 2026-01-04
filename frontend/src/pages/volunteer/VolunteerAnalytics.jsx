import { useState, useEffect } from 'react';
import { getVolunteerDashboard } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { FaChartLine, FaMedal, FaStopwatch } from 'react-icons/fa';

const VolunteerAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await getVolunteerDashboard();
                setData(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

    const { overview, analytics } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-full text-2xl"><FaMedal /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reliability Score</p>
                        <p className="text-3xl font-bold text-gray-800">{overview.reliabilityScore}%</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-full text-2xl"><FaChartLine /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Impact</p>
                        <p className="text-3xl font-bold text-gray-800">{overview.impactScore} <span className="text-sm text-gray-400 font-normal">delivered</span></p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-full text-2xl"><FaStopwatch /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Speed</p>
                        <p className="text-3xl font-bold text-gray-800">{overview.avgDeliveryTime} <span className="text-sm text-gray-400 font-normal">mins</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Delivery Activity (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.deliveriesByDay}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#2563EB" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default VolunteerAnalytics;
