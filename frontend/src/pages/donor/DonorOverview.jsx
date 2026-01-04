import { useState, useEffect } from 'react';
import { getDonorAnalytics } from '../../services/api';
import { FaCheckCircle, FaHandHoldingHeart } from 'react-icons/fa';
import Donate from '../Donate';

const DonorOverview = () => {
    const [stats, setStats] = useState({
        totalDonations: 0,
        completedDonations: 0,
        activeDonations: 0,
        peopleHelped: 0
    });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await getDonorAnalytics();
            setStats({
                totalDonations: data.summary.totalDonations,
                completedDonations: data.summary.completed,
                activeDonations: data.summary.active,
                peopleHelped: data.summary.peopleHelped
            });
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch donor stats:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard...</div>;

    const handleDonationSuccess = () => {
        setShowForm(false);
        setShowThankYou(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Value Proposition / Welcome Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-3xl font-bold mb-4">Make a Difference Today</h1>

                    {!showThankYou ? (
                        <>
                            <p className="text-emerald-50 text-lg mb-8">
                                Your contributions have already helped feed <span className="font-bold text-white">{stats.peopleHelped} people</span>.
                                Request a pickup now to continue your impact.
                            </p>

                            {!showForm ? (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-white text-emerald-600 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all inline-flex items-center"
                                >
                                    <FaHandHoldingHeart className="mr-2 text-xl" />
                                    Donate Food
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="bg-emerald-700 bg-opacity-50 text-white px-6 py-2 rounded-full font-medium hover:bg-opacity-70 transition-all inline-flex items-center text-sm mb-4"
                                >
                                    Cancel Donation
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-6">
                                <div className="flex items-center space-x-4 mb-2">
                                    <div className="bg-white text-emerald-600 rounded-full p-2">
                                        <FaCheckCircle className="text-2xl" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Thank You!</h2>
                                </div>
                                <p className="text-emerald-50 text-lg">
                                    Your donation has been posted successfully. A volunteer will be assigned shortly.
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowThankYou(false); setShowForm(true); }}
                                className="bg-white text-emerald-600 px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1 inline-flex items-center"
                            >
                                <FaHandHoldingHeart className="mr-2" />
                                Donate Again
                            </button>
                        </div>
                    )}
                </div>
                {/* Decorative Elements */}
                <FaHandHoldingHeart className="absolute right-0 bottom-0 text-white opacity-10 text-[250px] transform translate-x-10 translate-y-10" />
            </div>

            {/* Inline Donation Form */}
            {showForm && (
                <div className="animate-fade-in-down bg-white rounded-2xl shadow-lg border border-gray-100 p-1 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <Donate onSuccess={handleDonationSuccess} />
                </div>
            )}




        </div>
    );
};



export default DonorOverview;
