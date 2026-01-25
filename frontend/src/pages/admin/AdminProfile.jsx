import { useState, useEffect } from 'react';
import { getAdminProfile, updateAdminProfile, uploadImage } from '../../services/api';
import toast from 'react-hot-toast';
import { FaUser, FaPhone, FaSave, FaLock, FaShieldAlt, FaCamera } from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';

const AdminProfile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        avatar: '',

        email: '',
        role: '',
        lastLogin: ''
    });

    const { updateUser } = useAuth(); // Get updateUser from context

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await getAdminProfile();
            setFormData({
                name: data.name || '',
                phone: data.phone || '',
                avatar: data.avatar || '',

                email: data.email,
                role: data.role,
                lastLogin: data.lastLogin
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

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const { data } = await uploadImage(formData);
            setFormData(prev => ({ ...prev, avatar: data.filePath }));
            toast.success('Image uploaded temporarily. Click save to apply.');
            setUploading(false);
        } catch (error) {
            console.error(error);
            toast.error('Image upload failed');
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await updateAdminProfile({
                name: formData.name,
                phone: formData.phone,
                avatar: formData.avatar,

            });
            updateUser(data); // Sync context
            toast.success('Profile updated successfully!');
            setSaving(false);
        } catch (error) {
            toast.error('Failed to update profile');
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    const baseURL = 'http://localhost:5000'; // Make sure this matches your backend URL logic or use a config

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-10">
            {/* 1. Profile Card Header */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative group">
                    <div className="h-24 w-24 rounded-full overflow-hidden shadow-lg ring-4 ring-indigo-50 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                        {formData.avatar ? (
                            <img
                                src={formData.avatar.startsWith('http') ? formData.avatar : `${baseURL}${formData.avatar}`}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-white text-3xl font-bold">{formData.name.charAt(0)}</span>
                        )}
                    </div>
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition text-gray-600">
                        <FaCamera size={14} />
                    </label>
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full text-white text-xs font-bold">...</div>}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-gray-800">{formData.name}</h1>
                    <p className="text-gray-500">{formData.email}</p>
                    <div className="flex items-center justify-center md:justify-start mt-3 space-x-3">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                            {formData.role}
                        </span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold flex items-center">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                            Active
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Editable Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Personal Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <FaUser className="mr-2 text-indigo-500" /> Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-3 top-3 text-gray-400 scale-x-[-1]" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 9876543210"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>



                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center"
                    >
                        {saving ? (
                            <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div> Saving...</>
                        ) : (
                            <><FaSave className="mr-2" /> Save Changes</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminProfile;
