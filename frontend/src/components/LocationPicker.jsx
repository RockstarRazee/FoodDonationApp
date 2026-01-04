import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
};

const LocationPicker = ({ location, onLocationSelect }) => {
    // location prop is expected to be [lng, lat] (GeoJSON format) or null
    // Leaflet uses [lat, lng]

    const [position, setPosition] = useState(null);

    useEffect(() => {
        if (location) {
            setPosition({ lat: location[1], lng: location[0] });
        } else {
            setPosition(null);
        }
    }, [location]);

    const handleSetPosition = (latlng) => {
        setPosition(latlng);
        onLocationSelect([latlng.lng, latlng.lat]);
    };

    // Default center (Bangalore) if no location
    const center = position || { lat: 12.9716, lng: 77.5946 };

    return (
        <div className="h-80 w-full relative z-0">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterAutomatically lat={center.lat} lng={center.lng} />
                <LocationMarker position={position} setPosition={handleSetPosition} />
            </MapContainer>
        </div>
    );
};

export default LocationPicker;
