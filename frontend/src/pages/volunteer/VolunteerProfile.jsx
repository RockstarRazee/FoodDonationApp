import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateAdminProfile, uploadImage, updateUserProfile } from '../../services/api';
import toast from 'react-hot-toast';
import { FaUser, FaPhone, FaCamera, FaEnvelope, FaSave } from 'react-icons/fa';

// Reusing style from RecipientProfile, adapted for Volunteer context
const VolunteerProfile = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar: '',
        vehicleType: 'bike' // Specific to volunteer
    });

    // We can reuse the same image logic.
    // Assuming backend serves uploads from baseURL.
    const baseURL = 'http://localhost:5000';

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                avatar: user.avatar || '',
                vehicleType: user.vehicleType || 'bike'
            });
        }
    }, [user]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const { data } = await uploadImage(uploadData);
            setFormData(prev => ({ ...prev, avatar: data.filePath }));
            toast.success('Image uploaded temporarily. Click save to apply.');
        } catch (error) {
            toast.error('Image upload failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Using generic updateUserProfile which calls /auth/profile
            const { data } = await updateUserProfile(formData);
            updateUser(data);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">


            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="relative inline-block mb-4 group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto bg-gray-100">
                                {formData.avatar ? (
                                    <img
                                        src={formData.avatar.startsWith('http') ? formData.avatar : `${baseURL}${formData.avatar}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
                                        <FaUser />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                                <FaCamera className="text-sm" />
                                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                            </label>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mt-2 inline-block">
                            Volunteer
                        </span>
                    </div>
                </div>

                {/* Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <FaUser className="absolute left-4 top-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-4 top-3.5 text-gray-400 scale-x-[-1]" />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            {/* Vehicle Type (Future Proofing) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Vehicle</label>
                                <select
                                    value={formData.vehicleType}
                                    onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="bike">Bike / Scooter</option>
                                    <option value="car">Car</option>
                                    <option value="truck">Truck / Van</option>
                                    <option value="walk">On Foot</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center"
                            >
                                {loading ? 'Saving...' : <><FaSave className="mr-2" /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VolunteerProfile;
