import React, { useState, useEffect } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import { MapPin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css";

const LocationTracker = () => {
  const [viewState, setViewState] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 12,
  });
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [isTracking, setIsTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [stopovers, setStopovers] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const MAPBOX_TOKEN =
    "pk.eyJ1IjoicXVlZW56eTAxIiwiYSI6ImNtNHBrbDhzNDB1ejMya3M3N21tcm5teGEifQ.xhLfAJcCXm-YZMzuZ3lwMw";

  // WebViewJavascriptBridge setup
  const connectWebViewJavascriptBridge = (callback) => {
    if (window.WebViewJavascriptBridge) {
      callback(window.WebViewJavascriptBridge);
    } else {
      document.addEventListener(
        "WebViewJavascriptBridgeReady",
        () => callback(window.WebViewJavascriptBridge),
        false
      );
    }
  };

  const registerLocationCallback = (bridge) => {
    bridge.registerHandler("locationCallBack", (data, responseCallback) => {
      const parsedData = JSON.parse(data.data || "{}");
      if (parsedData.latitude && parsedData.longitude) {
        const newLocation = {
          latitude: parsedData.latitude,
          longitude: parsedData.longitude,
          timestamp: new Date().toISOString(),
        };

        setCurrentLocation(newLocation);
        setViewState((prevViewState) => ({
          ...prevViewState,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        }));
        setPath((prevPath) => [
          ...prevPath,
          [newLocation.longitude, newLocation.latitude],
        ]);
        responseCallback("Location received successfully");
      }
    });
  };

  const startLocationListener = () => {
    connectWebViewJavascriptBridge((bridge) => {
      bridge.callHandler("startLocationListener", "", () => {
        setIsTracking(true);
        setPath([]); // Clear previous path
      });
    });
  };

  const stopLocationListener = () => {
    connectWebViewJavascriptBridge((bridge) => {
      bridge.callHandler("stopLocationListener", "", () => {
        setIsTracking(false);
      });
    });
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setViewState((prevState) => ({
            ...prevState,
            latitude,
            longitude,
          }));
          setCurrentLocation({ latitude, longitude });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            alert(
              "Location permission denied. Please enable it in your browser settings."
            );
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            alert(
              "Position unavailable. Ensure location services are enabled."
            );
          } else if (error.code === error.TIMEOUT) {
            alert("Geolocation request timed out. Try again.");
          } else {
            alert("Unable to retrieve location.");
          }
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }

    // Register WebView location callback
    connectWebViewJavascriptBridge((bridge) => {
      registerLocationCallback(bridge);
    });
  }, []);

  return (
    <div className="relative h-screen w-full">
      <Map
        {...viewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Marker
          latitude={currentLocation.latitude}
          longitude={currentLocation.longitude}
        >
          <MapPin className="text-red-500" size={32} />
        </Marker>

        {path.length > 1 && (
          <Source
            type="geojson"
            data={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: path,
              },
            }}
          >
            <Layer
              id="route"
              type="line"
              paint={{
                "line-color": "#00FF00",
                "line-width": 3,
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
            onClick={startLocationListener}
          >
            Start Tracking
          </button>
          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            onClick={stopLocationListener}
          >
            Stop Tracking
          </button>
        </div>
        <button
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
          onClick={() => navigate("/device-data")}
        >
          View Journey History
        </button>
      </div>
    </div>
  );
};

export default LocationTracker;
