import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile, uploadImage } from '../../services/api';
import toast from 'react-hot-toast';
import { FaUser, FaPhone, FaSave, FaCamera } from 'react-icons/fa';

const RecipientProfile = () => {
    const { updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        avatar: '',
        email: '',
        role: '',

    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await getUserProfile();
            setFormData({
                name: data.name || '',
                phone: data.phone || '',
                avatar: data.avatar || '',
                email: data.email || '',
                role: data.role || 'recipient',

            });
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load profile');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const { data } = await uploadImage(uploadData);
            // Backend returns { message: '...', filePath: '/uploads/...' }
            setFormData(prev => ({ ...prev, avatar: data.filePath }));
            toast.success('Image uploaded temporarily. Click save to apply.');
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await updateUserProfile({
                name: formData.name,
                phone: formData.phone,
                avatar: formData.avatar,

            });
            updateUser(data);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    const baseURL = 'http://localhost:5000';

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-10">


            {/* 2. Profile Card Header */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative group">
                    <div className="h-24 w-24 rounded-full overflow-hidden shadow-lg ring-4 ring-emerald-50 flex items-center justify-center bg-gray-100">
                        {formData.avatar ? (
                            <img
                                src={formData.avatar.startsWith('http') ? formData.avatar : `${baseURL}${formData.avatar}`}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <FaUser className="text-4xl text-gray-300" />
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition text-gray-600">
                        <FaCamera size={14} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    {uploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div></div>}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-gray-800">{formData.name}</h1>
                    <p className="text-gray-500">{formData.email}</p>
                    <div className="flex items-center justify-center md:justify-start mt-3">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                            {formData.role}
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 3. Personal Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <FaUser className="mr-2 text-emerald-600" /> Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <FaPhone className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 890"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                                />
                            </div>
                        </div>
                    </div>
                </div>



                <button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transform hover:-translate-y-0.5 transition-all flex items-center justify-center"
                >
                    {saving ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div> Saving...</>
                    ) : (
                        <><FaSave className="mr-2" /> Save Changes</>
                    )}
                </button>
            </form>
        </div>
    );
};

export default RecipientProfile;
