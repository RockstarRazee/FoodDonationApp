import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const googleLogin = (token) => api.post('/auth/google', { token });
export const verifyOtp = (email, otp) => api.post('/auth/google/verify-otp', { email, otp });
export const updateRole = (role) => api.put('/auth/update-role', { role });
export const getUserProfile = () => api.get('/auth/profile');
export const updateUserProfile = (data) => api.put('/auth/profile', data);

// Donation APIs
export const createDonation = (data) => api.post('/donations', data);
export const getMyDonations = () => api.get('/donations/my');
export const getDonorStats = () => api.get('/donations/my/summary');
export const getDonorAnalytics = () => api.get('/donations/my/analytics');
export const getNearbyDonations = (lat, lon, distance) => api.get(`/donations/nearby?lat=${lat}&lon=${lon}&distance=${distance}`);
export const assignDonation = (id, data) => api.put(`/donations/${id}/assign`, data); // data includes pickupDeadline, deliveryDeadline
export const generateDonationOtp = (id, type) => api.post(`/donations/${id}/otp`, { type }); // type: 'pickup' | 'delivery'
export const updateDonationStatus = (id, status, otp) => api.put(`/donations/${id}/status`, { status, otp });
export const requestDonation = (id, location, address) => api.put(`/donations/${id}/request`, { location, address });
export const completeDonation = (id) => api.put(`/donations/${id}/complete`, {});

// Recipient APIs
export const getRecipientDashboard = () => api.get('/recipient/dashboard');

// Volunteer APIs
export const getVolunteerDashboard = () => api.get('/volunteer/dashboard');

// Admin APIs
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminAnalytics = () => api.get('/admin/analytics');
export const getAdminPerformance = () => api.get('/admin/performance');
export const getAdminNotifications = () => api.get('/admin/notifications');
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminDonations = () => api.get('/admin/donations');
export const getAdminProfile = () => api.get('/admin/profile');
export const updateAdminProfile = (data) => api.put('/admin/profile', data);
export const uploadImage = (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export default api;
