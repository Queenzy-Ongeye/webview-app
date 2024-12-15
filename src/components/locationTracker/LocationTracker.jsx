import React, { useState, useEffect } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import { MapPin } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";

const LocationTracker = () => {
  const [viewState, setViewState] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 12
  });
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 0,
    longitude: 0
  });
  const [isTracking, setIsTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [stopovers, setStopovers] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const MAPBOX_TOKEN = "pk.eyJ1IjoicXVlZW56eTAxIiwiYSI6ImNtNHBrbDhzNDB1ejMya3M3N21tcm5teGEifQ.xhLfAJcCXm-YZMzuZ3lwMw";

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setViewState(prevState => ({
            ...prevState,
            latitude,
            longitude,
          }));
          setCurrentLocation({ latitude, longitude });
        },
        (error) => {
          console.error("Error getting initial location:", error);
          alert("Unable to retrieve your location. Please ensure location services are enabled.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      setViewState(prevState => ({
        ...prevState,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      }));
    }
  }, [location]);

  const getLocationName = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`);
      const data = await response.json();
      return data.features[0]?.place_name || "Unknown location";
    } catch (error) {
      console.error("Error fetching location name:", error);
      return "Unknown location";
    }
  };

  const startTracking = () => {
    if ("geolocation" in navigator) {
      setIsTracking(true);
      setPath([]);
      setStopovers([]);
      let lastLocation = null;
      let stopoverTimeout = null;

      navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          const newLocation = {
            latitude,
            longitude,
            name: locationName,
            timestamp: new Date().toISOString()
          };

          setCurrentLocation(newLocation);
          setViewState(prevViewState => ({
            ...prevViewState,
            latitude,
            longitude
          }));

          setPath(prevPath => [...prevPath, [longitude, latitude]]);

          // Check for stopovers
          if (lastLocation) {
            const distance = calculateDistance(lastLocation, newLocation);
            if (distance < 0.05) { // Less than 50 meters
              if (stopoverTimeout) clearTimeout(stopoverTimeout);
              stopoverTimeout = setTimeout(() => {
                setStopovers(prevStopovers => [...prevStopovers, newLocation]);
              }, 60000); // 1 minute
            } else {
              if (stopoverTimeout) clearTimeout(stopoverTimeout);
            }
          }

          lastLocation = newLocation;

          const previousLocations = JSON.parse(localStorage.getItem('previousLocations') || '[]');
          const updatedLocations = [newLocation, ...previousLocations].slice(0, 10);
          localStorage.setItem('previousLocations', JSON.stringify(updatedLocations));
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to track your location. Please ensure location services are enabled.");
        }
      );
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    // You would also clear the watch here in a full implementation
  };

  const calculateDistance = (loc1, loc2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="relative h-screen w-full">
      <Map
        {...viewState}
        style={{width: "100%", height: "100%"}}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Marker 
          latitude={currentLocation.latitude} 
          longitude={currentLocation.longitude}
        >
          <MapPin className="text-red-500" size={32} />
        </Marker>

        {path.length > 1 && (
          <Source type="geojson" data={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: path
            }
          }}>
            <Layer
              id="route"
              type="line"
              paint={{
                'line-color': '#00FF00',
                'line-width': 3
              }}
            />
          </Source>
        )}

        {stopovers.map((stopover, index) => (
          <Marker 
            key={index}
            latitude={stopover.latitude} 
            longitude={stopover.longitude}
          >
            <div className="bg-blue-500 rounded-full p-2">
              <span className="text-white font-bold">{index + 1}</span>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 bg-gray-100/90 p-4 rounded-lg backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-2">
          <button 
            className="w-full bg-[#1a365d] hover:bg-[#2a466d] text-white py-2 px-4 rounded"
            onClick={startTracking}
          >
            Track Location
          </button>
          <button 
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            onClick={stopTracking}
          >
            Stop
          </button>
        </div>
        <button 
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
          onClick={() => navigate('/device-data')}
        >
          View Journey History
        </button>
      </div>
    </div>
  );
};

export default LocationTracker;
