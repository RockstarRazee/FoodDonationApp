import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import LocationPicker from '../components/LocationPicker';
import { FOOD_SUGGESTIONS } from '../data/foodSuggestions';
import axios from 'axios';
import { FaMapMarkerAlt, FaUtensils, FaSearchLocation } from 'react-icons/fa';
const REQUIRED_ACCURACY = 100; // meters
const MAX_POSITION_AGE = 5000; // 5 seconds
const LOCATION_TIMEOUT = 20000; // 20 seconds

const Donate = ({ onSuccess }) => {
    const [foodType, setFoodType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState(null); // [lng, lat]
    const [loading, setLoading] = useState(false);

    // Smart Features State
    const [foodSuggestions, setFoodSuggestions] = useState([]);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearchingAddr, setIsSearchingAddr] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Optional: Auto-detect location on load?
        // Let's rely on user action "Use Current Location" for better UX as per plan
    }, []);

    // Food Autocomplete
    const handleFoodChange = (e) => {
        const val = e.target.value;
        setFoodType(val);
        if (val.length > 0) {
            const filtered = FOOD_SUGGESTIONS.filter(f => f.toLowerCase().includes(val.toLowerCase()));
            setFoodSuggestions(filtered.slice(0, 5));
        } else {
            setFoodSuggestions([]);
        }
    };

    const selectFood = (val) => {
        setFoodType(val);
        setFoodSuggestions([]);
    };

    // Address Autocomplete (Debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (address.length > 2 && !location) { // Only search if not already pinned (to avoid loop on select)
                setIsSearchingAddr(true);
                try {
                    const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?q=${address}&format=json&addressdetails=1&limit=5`);
                    setAddressSuggestions(data);
                } catch (error) {
                    console.error("Address search failed", error);
                } finally {
                    setIsSearchingAddr(false);
                }
            } else {
                setAddressSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [address, location]);

    const handleAddressChange = (e) => {
        setAddress(e.target.value);
        // Reset location if user manually types? 
        // Better to keep location until they pick new one or clear
        // But if they type, previous pinned location might be wrong.
        // Let's keep it simple: manual typing searches again.
        if (location) setLocation(null);
    };

    const selectAddress = (item) => {
        setAddress(item.display_name);
        setAddressSuggestions([]);
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        setLocation([lon, lat]); // GeoJSON [lng, lat]
        toast.success("Location pinned from address!");
    };

    // GPS Location
    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        setLocation(null);
        setAddress('');

        let watchId;
        let timeoutId;
        const startTime = Date.now();

        // Helper to cleanup
        const cleanup = () => {
            if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
            if (timeoutId !== undefined) clearTimeout(timeoutId);
            setIsLocating(false);
        };

        toast.loading("Starting GPS... Waiting for precise signal", { id: 'geo' });

        watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const positionAge = Date.now() - position.timestamp;

                console.log("GPS UPDATE", {
                    accuracy,
                    positionAge,
                    lat: latitude,
                    lng: longitude,
                });

                // 🚫 Reject cached / old locations
                if (positionAge > MAX_POSITION_AGE) {
                    console.log("Ignoring cached location (Age: " + positionAge + "ms)");
                    return;
                }

                // 🚫 Reject inaccurate locations
                if (accuracy > REQUIRED_ACCURACY) {
                    // Update UI with progress but don't accept yet
                    const elapsed = Date.now() - startTime;
                    let msg = `Getting GPS lock... Accuracy: ${Math.round(accuracy)}m`;
                    if (elapsed > 8000 && accuracy > 1000) {
                        msg = "Weak signal. Try moving outdoors 📡";
                    }
                    toast.loading(msg, { id: 'geo' });
                    console.log("Low accuracy, waiting for better fix");
                    return;
                }

                // ✅ ACCEPT REAL GPS LOCATION
                cleanup();

                // 1. Set Location (GeoJSON [lng, lat])
                setLocation([longitude, latitude]);

                // 2. Reverse Geocode
                try {
                    const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    if (data && data.display_name) {
                        setAddress(data.display_name);
                    }
                } catch (err) {
                    console.error("Reverse geocode failed", err);
                }

                toast.success(`GPS Locked! (Accuracy: ${Math.round(accuracy)}m)`, { id: 'geo' });
            },
            (error) => {
                console.error("GPS Error:", error);
                if (error.code === 1) { // Permission denied
                    cleanup();
                    toast.error("Permission denied. Enable location services.", { id: 'geo' });
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,     // 🔥 CRITICAL: Force fresh reading
                timeout: LOCATION_TIMEOUT,
            }
        );

        // Safety timeout - Fail hard if no real GPS found
        timeoutId = setTimeout(() => {
            cleanup();
            toast.error(
                "Unable to get your current location. Please move outdoors and try again or enter address manually.",
                { id: 'geo', duration: 5000 }
            );
        }, LOCATION_TIMEOUT);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!location) {
            toast.error('Location is required. Please select on map.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/donations', {
                foodType,
                quantity,
                expiryDate,
                address,
                location // [lon, lat]
            });
            toast.success('Donation posted successfully!');
            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/dashboard/donations');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to post donation');
        } finally {
            setLoading(false);
        }
    };

    // Min date = today
    const minDate = new Date().toISOString().split('T')[0];

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FaUtensils className="text-9xl text-white transform rotate-12" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2 relative z-10">Donate Food</h1>
                    <p className="text-emerald-50 relative z-10 font-medium">Share your surplus, feed a community.</p>
                </div>

                <div className="p-8 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Food Details Section */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Food Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Food Type</label>
                                    <div className="relative group">
                                        <FaUtensils className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={foodType}
                                            onChange={handleFoodChange}
                                            onBlur={() => setTimeout(() => setFoodSuggestions([]), 200)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all outline-none"
                                            placeholder="e.g. Rice & Curry"
                                            required
                                        />
                                    </div>
                                    {foodSuggestions.length > 0 && (
                                        <ul className="absolute z-20 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2 animate-fade-in">
                                            {foodSuggestions.map((f, i) => (
                                                <li
                                                    key={i}
                                                    onMouseDown={() => selectFood(f)}
                                                    className="px-5 py-3 hover:bg-emerald-50 cursor-pointer text-sm text-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                                >
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                                    <input
                                        type="text"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all outline-none"
                                        placeholder="e.g. 5kg, 10 packets"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={expiryDate}
                                    min={minDate + 'T00:00'}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all outline-none text-gray-600"
                                    required
                                />
                            </div>
                        </div>

                        {/* Location Details Section */}
                        <div className="space-y-6 pt-2">
                            <div className="flex justify-between items-end border-b pb-2">
                                <h2 className="text-lg font-semibold text-gray-800">Pickup Location</h2>
                                <button
                                    type="button"
                                    onClick={handleUseCurrentLocation}
                                    disabled={isLocating}
                                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${isLocating
                                        ? 'bg-gray-100 text-gray-400 cursor-wait'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700'
                                        }`}
                                >
                                    <FaSearchLocation className={isLocating ? 'animate-bounce' : ''} />
                                    <span>{isLocating ? "Locating..." : "Use My Location"}</span>
                                </button>
                            </div>

                            <div className="relative group">
                                <FaMapMarkerAlt className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <textarea
                                    value={address}
                                    onChange={handleAddressChange}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all outline-none resize-none"
                                    placeholder="Enter full address or detect location..."
                                    rows="2"
                                    required
                                />
                                {isSearchingAddr && (
                                    <div className="absolute right-4 top-4">
                                        <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                                {addressSuggestions.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2 animate-fade-in">
                                        {addressSuggestions.map((item, i) => (
                                            <li
                                                key={i}
                                                onMouseDown={() => selectAddress(item)}
                                                className="px-5 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                            >
                                                <p className="text-sm font-semibold text-gray-800 truncate">{item.display_name.split(',')[0]}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.display_name}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pin Precise Location</label>
                                <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 ring-4 ring-gray-50">
                                    <LocationPicker location={location} onLocationSelect={setLocation} />
                                </div>
                                {!location && <p className="text-xs text-amber-500 mt-2 font-medium flex items-center"><span className="mr-1">⚠️</span> Please confirm your location on the map.</p>}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transform transition-all duration-200 ${loading
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-emerald-500/30 hover:-translate-y-1 active:translate-y-0'
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Publishing...</span>
                                    </span>
                                ) : (
                                    'Post Donation'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Donate;
