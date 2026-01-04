import { useState, useEffect } from 'react';
import { getRecipientDashboard } from '../../services/api';
import { getImageUrl } from '../../utils/imageHelper';
import { socket } from '../../services/socket';
import { FaTrophy, FaMedal, FaUserCircle, FaHandHoldingHeart, FaTruck } from 'react-icons/fa';

const RecipientAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('donors'); // For mobile or single view focus

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await getRecipientDashboard();
                setData(data.analytics);
                setLoading(false);
            } catch (error) {
                console.error("Analytics Error:", error);
                setLoading(false);
            }
        };
        fetch();

        const handleUpdate = () => {
            fetch();
        };

        socket.on('donationUpdated', handleUpdate);

        return () => {
            socket.off('donationUpdated', handleUpdate);
        };
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading heroes...</div>;
    if (!data) return <div className="p-12 text-center text-gray-500">No data available yet.</div>;

    const { volunteerHeroes, donorHeroes } = data;

    const LeaderboardList = ({ title, icon: Icon, heroes, type }) => (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${type === 'donor' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Icon className="text-xl" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Top 5 Performers</p>
                    </div>
                </div>
            </div>

            <div className="p-2">
                {heroes.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                        <Icon className="mx-auto text-4xl mb-3 opacity-20" />
                        <p>No heroes yet.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {heroes.map((hero, index) => {
                            let rankBadge = null;
                            if (index === 0) rankBadge = <FaTrophy className="text-yellow-400 text-xl drop-shadow-sm" />;
                            else if (index === 1) rankBadge = <FaMedal className="text-gray-400 text-lg" />;
                            else if (index === 2) rankBadge = <FaMedal className="text-amber-600 text-lg" />;
                            else rankBadge = <span className="text-gray-400 font-bold w-6 text-center">{index + 1}</span>;

                            return (
                                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-8 flex justify-center">{rankBadge}</div>

                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                                                {hero.avatar ? (
                                                    <img src={getImageUrl(hero.avatar)} alt={hero.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FaUserCircle className="text-gray-400 text-3xl" />
                                                )}
                                            </div>
                                            {index === 0 && (
                                                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                                                    #1
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                                                {hero.name}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {type === 'donor' ? 'Generous Soul' : 'Community Helper'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${type === 'donor'
                                        ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        }`}>
                                        {hero.count} <span className="text-[10px] uppercase font-medium ml-1">{type === 'donor' ? 'Donations' : 'Helps'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-12">


            <div className="grid lg:grid-cols-2 gap-8">
                <LeaderboardList
                    title="Top Donors"
                    icon={FaHandHoldingHeart}
                    heroes={donorHeroes || []}
                    type="donor"
                />
                <LeaderboardList
                    title="Top Volunteers"
                    icon={FaTruck}
                    heroes={volunteerHeroes || []}
                    type="volunteer"
                />
            </div>
        </div>
    );
};

export default RecipientAnalytics;
