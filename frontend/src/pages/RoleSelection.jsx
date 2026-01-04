import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHandHoldingHeart, FaTruck, FaUsers } from 'react-icons/fa';

const RoleSelection = () => {
    const { updateUserRole } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);

    const roles = [
        {
            id: 'donor',
            title: 'Donor',
            description: 'I want to donate food to those in need.',
            icon: <FaHandHoldingHeart className="text-4xl mb-4 text-pink-500" />,
            color: 'from-pink-500 to-rose-500',
            bg: 'bg-pink-50',
            border: 'border-pink-200'
        },
        {
            id: 'volunteer',
            title: 'Volunteer',
            description: 'I want to help deliver food to recipients.',
            icon: <FaTruck className="text-4xl mb-4 text-blue-500" />,
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-50',
            border: 'border-blue-200'
        },
        {
            id: 'recipient',
            title: 'Recipient',
            description: 'I am looking for food support.',
            icon: <FaUsers className="text-4xl mb-4 text-green-500" />,
            color: 'from-green-500 to-emerald-500',
            bg: 'bg-green-50',
            border: 'border-green-200'
        }
    ];

    const handleRoleSelect = async () => {
        if (!selectedRole) return;
        setLoading(true);
        const success = await updateUserRole(selectedRole);
        if (success) {
            navigate('/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-5xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Choose Your Role</h1>
                    <p className="text-lg text-gray-600">Tell us how you’d like to use the platform.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`
                                relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 transform hover:-translate-y-2
                                ${selectedRole === role.id
                                    ? `ring-4 ring-offset-2 ring-purple-500 shadow-xl scale-105 bg-white`
                                    : 'bg-white hover:shadow-lg border border-gray-100'
                                }
                            `}
                        >
                            <div className={`
                                absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${role.color}
                            `}></div>

                            <div className="flex flex-col items-center text-center">
                                <div className={`p-4 rounded-full ${role.bg} mb-6`}>
                                    {role.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">{role.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{role.description}</p>
                            </div>

                            {selectedRole === role.id && (
                                <div className="absolute top-4 right-4 text-purple-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={handleRoleSelect}
                        disabled={!selectedRole || loading}
                        className={`
                            px-12 py-4 rounded-full text-lg font-bold text-white shadow-lg transition-all transform
                            ${!selectedRole || loading
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 hover:shadow-xl'
                            }
                        `}
                    >
                        {loading ? 'Updating Profile...' : 'Continue to Dashboard'}
                    </button>
                    <p className="mt-4 text-sm text-gray-500">
                        * You can change this later in your profile settings
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
