import React, { useState } from "react";
import ReactMapGL, { Marker } from "react-map-gl";
import { MapPin } from 'lucide-react';

const LocationTracker = () => {
  const [viewport, setViewport] = useState({
    latitude: -1.2921,
    longitude: 36.8219,
    zoom: 12
  });
  const [currentLocation, setCurrentLocation] = useState({
    latitude: -1.2921,
    longitude: 36.8219
  });
  const [isTracking, setIsTracking] = useState(false);

  // Replace with your actual Mapbox token
  const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

  const startTracking = () => {
    if ("geolocation" in navigator) {
      setIsTracking(true);
      navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setViewport(prevViewport => ({
            ...prevViewport,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    // You would also clear the watch here in a full implementation
  };

  return (
    <div className="relative h-screen w-full">
      <ReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle="mapbox://styles/mapbox/light-v11"
        onViewportChange={setViewport}
        mapboxApiAccessToken={MAPBOX_TOKEN}
      >
        <Marker 
          latitude={currentLocation.latitude} 
          longitude={currentLocation.longitude}
        >
          <MapPin className="text-red-500" size={32} />
        </Marker>
      </ReactMapGL>

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
        >
          View Journey History
        </button>
      </div>
    </div>
  );
};

export default LocationTracker;

