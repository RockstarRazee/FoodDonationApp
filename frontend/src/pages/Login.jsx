import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from '../components/auth/AuthLayout';
import LoginCard from '../components/auth/LoginCard';
import RoleDivider from '../components/auth/RoleDivider';
import { resendOtp } from '../services/api';

const ResendOtpButton = ({ email }) => {
    const [timer, setTimer] = useState(30); // 30 seconds
    const [canResend, setCanResend] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleResend = async () => {
        setLoading(true);
        try {
            await resendOtp(email);
            setTimer(30);
            setCanResend(false);
            alert('OTP Resent Successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || loading}
            className={`w-full text-sm font-bold transition-colors py-2 ${canResend ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
        >
            {loading ? 'Sending...' : canResend ? 'Resend OTP' : `Resend OTP in ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`}
        </button>
    );
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const { googleAuth, login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'recipient') navigate('/recipient');
            else if (user.role === 'volunteer') navigate('/volunteer');
            else navigate("/dashboard");
        }
    }, [user, navigate]);

    const handleGoogleSuccess = async (credentialResponse) => {
        const emailFromApi = await googleAuth(credentialResponse.credential);
        if (emailFromApi) {
            setEmail(emailFromApi);
            setShowOtp(true);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const success = await login(email, otp);
        if (success) {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData && !userData.isProfileComplete) {
                navigate('/select-role');
            } else if (userData?.role === 'recipient') {
                navigate('/recipient');
            } else if (userData?.role === 'volunteer') {
                navigate('/volunteer');
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <AuthLayout>
            <LoginCard title="FoodConnect">
                {!showOtp ? (
                    <div className="space-y-6">
                        {/* Primary Login */}
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Failed')}
                            theme="filled_blue"
                            size="large"
                            text="continue_with"
                            shape="pill"
                            width="100%"
                            logo_alignment="left"
                        />

                        <RoleDivider />

                        {/* Admin Login */}
                        <div className="space-y-3">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => console.log('Admin Login Failed')}
                                theme="filled_black"
                                size="large"
                                text="signin_with"
                                shape="pill"
                                width="100%"
                                logo_alignment="left"
                            />
                            <p className="text-center text-gray-400 text-xs font-medium">
                                Admin Access requires registered email
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6 animate-fade-in-up">
                        <div className="text-center bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-blue-600 text-xs font-bold uppercase mb-1">OTP Sent to</p>
                            <p className="text-gray-800 font-bold">{email}</p>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center tracking-[0.5em] text-2xl font-mono"
                                placeholder="••••••"
                                maxLength={6}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                Verify & Login
                            </button>

                            <ResendOtpButton email={email} />

                            <button
                                type="button"
                                onClick={() => setShowOtp(false)}
                                className="w-full text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </LoginCard>
        </AuthLayout>
    );
};

export default Login;
