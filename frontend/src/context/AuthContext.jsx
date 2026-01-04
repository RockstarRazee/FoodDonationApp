import { createContext, useState, useEffect, useContext } from 'react';
import { verifyOtp as verifyOtpApi, googleLogin as googleLoginApi, updateRole as updateRoleApi } from '../services/api';
import toast from 'react-hot-toast';
import { socket } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);

        const handleUserUpdate = (updatedUser) => {
            // Only update if it matches the current logged-in user
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser && currentUser._id === updatedUser._id) {
                const mergedUser = { ...currentUser, ...updatedUser };
                localStorage.setItem('user', JSON.stringify(mergedUser));
                setUser(mergedUser); // Update state to trigger re-renders (Header, etc.)
                toast.success('Your profile was updated remotely.');
            }
        };

        socket.on('userUpdated', handleUserUpdate);

        return () => {
            socket.off('userUpdated', handleUserUpdate);
        };
    }, []);

    const googleAuth = async (token) => {
        try {
            const { data } = await googleLoginApi(token);
            toast.success('OTP sent to your email!');
            return data.email; // Return email to be used in Login component
        } catch (error) {
            toast.error(error.response?.data?.message || 'Google Login failed');
            return null;
        }
    };

    const login = async (email, otp) => {
        setLoading(true);
        try {
            const { data } = await verifyOtpApi(email, otp);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Login successful!');
            return true; // Return true to signal successful login, component will handle navigation
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (role) => {
        setLoading(true);
        try {
            const { data } = await updateRoleApi(role);
            localStorage.setItem('token', data.token); // Token might be refreshed
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Role updated successfully!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Logged out');
    };

    return (
        <AuthContext.Provider value={{ user, loading, googleAuth, login, logout, updateUserRole, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
