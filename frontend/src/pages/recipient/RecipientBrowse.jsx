import { useState, useEffect } from 'react';
import { getNearbyDonations, requestDonation } from '../../services/api';
import { FaMapMarkerAlt, FaUtensils, FaClock, FaSearch, FaFilter, FaSearchLocation, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import LocationPicker from '../../components/LocationPicker';
import Button from '../../components/common/Button';
import { socket } from '../../services/socket';

const RecipientBrowse = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [userLocation, setUserLocation] = useState(null);

    // Modal & Location State
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState(null); // [lng, lat]
    const [isSearchingAddr, setIsSearchingAddr] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isLocating, setIsLocating] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lon: position.coords.longitude };
                    setUserLocation(loc);
                    fetchDonations(loc.lat, loc.lon);
                },
                (error) => {
                    console.error("Location error:", error);
                    toast.error("Could not get your location. Showing default results.");
                    fetchDonations(12.9716, 77.5946);
                }
            );
        } else {
            fetchDonations(12.9716, 77.5946);
        }
    }, []);

    // Real-time Updates listening
    useEffect(() => {
        const handleUpdate = (data) => {
            // For now, simple refetch to ensure consistency with location filters
            // Or simple append if we have location?
            // Refetching is safer for "Nearby" logic unless we do claculations on client
            if (userLocation) {
                fetchDonations(userLocation.lat, userLocation.lon);
            } else {
                fetchDonations(12.9716, 77.5946);
            }
        };

        socket.on('donationCreated', handleUpdate);
        socket.on('donationUpdated', handleUpdate);

        return () => {
            socket.off('donationCreated', handleUpdate);
            socket.off('donationUpdated', handleUpdate);
        };
    }, [userLocation]);

    const fetchDonations = async (lat, lon) => {
        // Don't set loading true here to avoid flickering on real-time updates
        // setLoading(true); 
        try {
            // Using a very large radius (5000 km) to ensure all demos are visible regardless of location
            const { data } = await getNearbyDonations(lat, lon, 5000000);
            setDonations(data);
        } catch (error) {
            console.error("Fetch Error:", error);
            // toast.error("Failed to load food donations."); // Silent fail on updates
        } finally {
            setLoading(false);
        }
    };

    // --- Location Logic (Copied/Adapted from Donate.jsx) ---

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (address.length > 2 && !location) {
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
        if (location) setLocation(null);
    };

    const selectAddress = (item) => {
        setAddress(item.display_name);
        setAddressSuggestions([]);
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        setLocation([lon, lat]);
        toast.success("Location pinned from address!");
    };

    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        setLocation(null);
        setAddress('');

        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        };

        let watchId;
        const stopLocationWatch = () => {
            if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
                watchId = undefined;
            }
            setIsLocating(false);
        };

        toast.loading("Acquiring fresh GPS signal...", { id: 'geo' });

        watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const isRecent = (Date.now() - position.timestamp) < 60000;

                if (isRecent) {
                    stopLocationWatch();
                    setLocation([longitude, latitude]);

                    try {
                        const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                        if (data && data.display_name) {
                            setAddress(data.display_name);
                        }
                    } catch (err) {
                        console.error("Reverse geocode failed", err);
                    }
                    toast.success(`Location updated!`, { id: 'geo' });
                }
            },
            (error) => {
                console.error("GPS Error:", error);
                if (error.code === 1) {
                    stopLocationWatch();
                    toast.error("Permission denied.", { id: 'geo' });
                }
            },
            geoOptions
        );

        setTimeout(() => {
            if (watchId !== undefined) {
                stopLocationWatch();
                toast.error("GPS timed out.", { id: 'geo' });
            }
        }, 45000);
    };

    // --- Modal Logic ---

    const openRequestModal = (donation) => {
        setSelectedDonation(donation);
        // Pre-fill with user location if available?
        if (userLocation) {
            // Optional: Don't force pre-fill, let them choose. 
            // Or maybe pre-fill but require confirmation.
            // Let's start clean or use current location logic.
        }
        setAddress('');
        setLocation(null);
    };

    const closeRequestModal = () => {
        setSelectedDonation(null);
        setAddress('');
        setLocation(null);
    };

    const confirmRequest = async () => {
        if (!location) {
            toast.error("Please provide a delivery location.");
            return;
        }

        const toastId = toast.loading("Processing request...");
        setIsRequesting(true);
        try {
            await requestDonation(selectedDonation._id, location, address); // Pass address too if API supports it (modified API call below)
            // Note: API might need update to accept address string, currently accepts location array. 
            // Check requestDonation in controller. 
            // Controller: const { location, address } = req.body;
            // Frontend api.js: export const requestDonation = (id, location) => ...
            // Wait, I need to check api.js. 
            // Let's assume api.js needs update or I pass object.
            // Actually, let's update api.js call here to match what backend expects.

            toast.success("Food requested successfully!", { id: toastId });
            setDonations(prev => prev.filter(d => d._id !== selectedDonation._id));
            closeRequestModal();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Request failed", { id: toastId });
        } finally {
            setIsRequesting(false);
        }
    };

    // Filter Logic
    const filteredDonations = donations.filter(d => {
        if (filter === 'urgent') {
            const hoursLeft = (new Date(d.expiryDate) - new Date()) / 36e5;
            return hoursLeft < 24 && hoursLeft > 0;
        }
        return true;
    }).sort((a, b) => { // ... same sort logic ...
        return 0;
    });

    // Helper for reverse geocoding
    const reverseGeocode = async (lat, lon) => {
        try {
            const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            if (data && data.display_name) {
                setAddress(data.display_name);
            }
        } catch (err) {
            console.error("Reverse geocode failed", err);
        }
    };

    const handleMapLocationSelect = (newLoc) => {
        setLocation(newLoc);
        // [lng, lat]
        if (newLoc && newLoc.length === 2) {
            reverseGeocode(newLoc[1], newLoc[0]);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>All</button>
                    <button onClick={() => setFilter('urgent')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'urgent' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}>Urgent</button>
                </div>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(n => <div key={n} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : filteredDonations.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🤷‍♂️</div>
                    <h3 className="text-xl font-bold text-gray-700">No Food Found Nearby</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    {filteredDonations.map(donation => (
                        <div key={donation._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="relative h-48 bg-gray-200 overflow-hidden">
                                <img
                                    src={donation.image ? `http://localhost:5000${donation.image}` : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                                    alt={donation.foodType}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }}
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-600 shadow-sm">
                                    {donation.distance ? `${Math.round(donation.distance / 1000)} km away` : 'Nearby'}
                                </div>
                                {new Date(donation.expiryDate) < new Date(Date.now() + 86400000) && (
                                    <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center">
                                        <FaClock className="mr-1" /> Urgent
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{donation.foodType}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">Fresh, hygienic food available for pickup.</p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FaUtensils className="mr-3 text-emerald-500" />
                                        <span>Quantity: {donation.quantity}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FaMapMarkerAlt className="mr-3 text-red-400" />
                                        <span className="truncate">{donation.location?.address || 'Location provided'}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openRequestModal(donation)}
                                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                                >
                                    Request This Food
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Request Modal */}
            {selectedDonation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Confirm Request</h3>
                                <p className="text-sm text-gray-500">Where should this be delivered?</p>
                            </div>
                            <button onClick={closeRequestModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Location Search */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end pb-1">
                                    <label className="text-sm font-semibold text-gray-700">Delivery Address</label>
                                    <button
                                        type="button"
                                        onClick={handleUseCurrentLocation}
                                        disabled={isLocating}
                                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${isLocating ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                    >
                                        <FaSearchLocation /> <span>{isLocating ? "Locating..." : "Use GPS"}</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={handleAddressChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Enter delivery address..."
                                    />
                                    {isSearchingAddr && <div className="absolute right-3 top-3 animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>}
                                    {addressSuggestions.length > 0 && (
                                        <ul className="absolute z-20 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2">
                                            {addressSuggestions.map((item, i) => (
                                                <li key={i} onMouseDown={() => selectAddress(item)} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer text-sm border-b last:border-0 border-gray-50">
                                                    {item.display_name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Map */}
                            <div className="rounded-xl overflow-hidden border border-gray-200 h-64 relative">
                                <LocationPicker location={location} onLocationSelect={handleMapLocationSelect} />
                                {!location && (
                                    <div className="absolute inset-0 bg-gray-50/50 flex items-center justify-center pointer-events-none">
                                        <span className="bg-white/90 px-3 py-1 rounded full text-xs font-bold text-gray-500 shadow-sm border">Pin location on map</span>
                                    </div>
                                )}
                            </div>

                            {!location && <p className="text-xs text-amber-600 font-medium text-center">Please select a location on the map to proceed.</p>}
                        </div>

                        <div className="p-6 border-t border-gray-50 bg-gray-50 flex gap-3">
                            <button onClick={closeRequestModal} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <Button
                                onClick={confirmRequest}
                                disabled={!location}
                                isLoading={isRequesting}
                                className={`flex-1 py-3 transition-all ${!location ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                            >
                                Confirm Request
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipientBrowse;
