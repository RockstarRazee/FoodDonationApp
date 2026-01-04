import { useState, useEffect } from 'react';
import { getAdminPerformance } from '../../services/api';
import { FaMedal, FaTrophy, FaUserCheck } from 'react-icons/fa';

const AdminPerformance = () => {
    const [performance, setPerformance] = useState({ volunteers: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            const { data } = await getAdminPerformance();
            setPerformance(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch performance data:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-800">Top Performers</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Volunteer Leaderboard */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center">
                                <FaTrophy className="mr-2 text-yellow-300" /> Star Volunteers
                            </h3>
                            <p className="text-indigo-100 text-sm mt-1">Most reliable delivery partners</p>
                        </div>
                    </div>
                    <div className="p-0">
                        {performance.volunteers.length === 0 ? (
                            <p className="p-6 text-center text-gray-500">No data available yet.</p>
                        ) : (
                            performance.volunteers.map((vol, index) => (
                                <div key={index} className="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                            index === 1 ? 'bg-gray-100 text-gray-600' :
                                                index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800">{vol.name}</h4>
                                        <p className="text-xs text-gray-500">{vol.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-indigo-600">{vol.deliveries}</p>
                                        <p className="text-xs text-gray-400">Deliveries</p>
                                    </div>
                                    {index === 0 && <FaMedal className="ml-3 text-yellow-400 text-xl" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Donor Leaderboard */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center">
                                <FaUserCheck className="mr-2 text-green-200" /> Top Donors
                            </h3>
                            <p className="text-emerald-100 text-sm mt-1">Leading food contributors</p>
                        </div>
                    </div>
                    <div className="p-0">
                        {performance.donors?.length === 0 ? (
                            <p className="p-6 text-center text-gray-500">No data available yet.</p>
                        ) : (
                            performance.donors?.map((donor, index) => (
                                <div key={index} className="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                            index === 1 ? 'bg-gray-100 text-gray-600' :
                                                index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800">{donor.name}</h4>
                                        <p className="text-xs text-gray-500">{donor.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-emerald-600">{donor.donations}</p>
                                        <p className="text-xs text-gray-400">Donations</p>
                                    </div>
                                    {index === 0 && <FaMedal className="ml-3 text-yellow-400 text-xl" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPerformance;
