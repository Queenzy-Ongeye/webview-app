import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl";
import { MapPin } from "lucide-react";
import { Button } from "../reusableCards/Buttons";
import { Card, CardContent, CardFooter } from "../reusableCards/cards";
import { Alert, AlertDescription, AlertTitle } from "../reusableCards/alert";
import { Badge } from "../reusableCards/Badge";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoicXVlZW56eTAxIiwiYSI6ImNtNHBrbDhzNDB1ejMya3M3N21tcm5teGEifQ.xhLfAJcCXm-YZMzuZ3lwMw";

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
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to fetch the user's current location
  const fetchCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Location fetched successfully:", {
            latitude,
            longitude,
          });
          setCurrentLocation({ latitude, longitude });
          setViewState((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
          setPath((prevPath) => [...prevPath, [longitude, latitude]]);
        },
        (err) => {
          console.error("Geolocation error:", err);
          if (err.code === 1) {
            setError(
              "Location permission denied. Please enable location access in your browser or system settings."
            );
          } else if (err.code === 2) {
            setError("Location position unavailable. Please try again.");
          } else if (err.code === 3) {
            setError("Location request timed out. Please try again.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Config options
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

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
      try {
        console.log("Location callback triggered:", data);
        const parsedData = JSON.parse(data || "{}");

        if (parsedData.latitude && parsedData.longitude) {
          const newLocation = {
            latitude: parsedData.latitude,
            longitude: parsedData.longitude,
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

          setStopovers((prevStopovers) => [
            ...prevStopovers,
            {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            },
          ]);

          responseCallback("Location received successfully");
        } else {
          console.error("Invalid location data received:", parsedData);
        }
      } catch (err) {
        console.error("Error in location callback:", err);
      }
    });
  };

  useEffect(() => {
    connectWebViewJavascriptBridge((bridge) => {
      console.log("Bridge initialized:", bridge);
      if (bridge) {
        registerLocationCallback(bridge);
      } else {
        console.error(
          "Bridge is undefined or null. Falling back to browser location."
        );
        fetchCurrentLocation(); // Fallback to browser geolocation
      }
    });
  }, []);

  const startLocationListener = () => {
    if (window.WebViewJavascriptBridge) {
      console.log(
        "Calling startLocationListener via WebViewJavascriptBridge..."
      );

      window.WebViewJavascriptBridge.callHandler(
        "startLocationListener",
        "",
        (responseData) => {
          console.log("Response from startLocationListener:", responseData);
          setIsTracking(true);
          setPath([]); // Reset the path for a new tracking session
          setError(null);
          fetchCurrentLocation(); // Fetch current location when starting
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const stopLocationListener = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "stopLocationListener",
        "",
        (responseData) => {
          setIsTracking(false);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setError("Location permission denied. Please enable it.");
          }
        });
    }
  }, []);

  return (
    <div className="relative z-0 w-full h-full overflow-hidden">
      <Map
        {...viewState}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {currentLocation.latitude !== 0 && currentLocation.longitude !== 0 && (
          <Marker
            latitude={currentLocation.latitude}
            longitude={currentLocation.longitude}
          >
            <MapPin className="text-red-500 w-6 h-6 sm:w-8 sm:h-8" />
          </Marker>
        )}

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
                "line-color": "#10B981",
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
            <Badge
              variant="secondary"
              className="w-6 h-6 rounded-full flex items-center justify-center"
            >
              {index + 1}
            </Badge>
          </Marker>
        ))}
      </Map>

      <Card className="absolute bottom-20 left-4 right-4 max-w-md xs:max-w-screen sm:max-w-screen mx-auto bg-white/90 backdrop-blur-sm sm:left-4 sm:right-auto">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold">Location Tracker</h2>
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? "Tracking" : "Idle"}
            </Badge>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant={isTracking ? "secondary" : "default"}
              onClick={startLocationListener}
              disabled={isTracking}
              className="w-full bg-black text-white"
            >
              Start Tracking
            </Button>
            <Button
              variant="destructive"
              onClick={stopLocationListener}
              disabled={!isTracking}
              className="w-full bg-red-700 text-white"
            >
              Stop Tracking
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 rounded-b-lg">
          <Button
            variant="outline"
            className="w-full bg-oves-blue/65 text-white"
            onClick={() => navigate("/device-data")}
          >
            View Journey History
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LocationTracker;
