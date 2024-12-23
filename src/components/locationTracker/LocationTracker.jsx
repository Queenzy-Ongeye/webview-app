import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl";
import { MapPin } from "lucide-react";
import { Button } from "../reusableCards/Buttons";
import { Card, CardContent, CardFooter } from "../reusableCards/cards";
import { Alert, AlertDescription, AlertTitle } from "../reusableCards/alert";
import { Badge } from "../reusableCards/Badge";

const MAPBOX_TOKEN = "pk.eyJ1IjoicXVlZW56eTAxIiwiYSI6ImNtNHBrbDhzNDB1ejMya3M3N21tcm5teGEifQ.xhLfAJcCXm-YZMzuZ3lwMw";

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
  const [bridgeReady, setBridgeReady] = useState(false);
  const navigate = useNavigate();

  // Initialize WebView bridge
  useEffect(() => {
    const initializeBridge = () => {
      if (window.WebViewJavascriptBridge) {
        console.log("Bridge already initialized");
        setBridgeReady(true);
        return;
      }

      if (window.WVJBCallbacks) {
        window.WVJBCallbacks.push(() => setBridgeReady(true));
        return;
      }

      window.WVJBCallbacks = [() => setBridgeReady(true)];
      
      // Create WVJBIframe for iOS WebView
      const WVJBIframe = document.createElement('iframe');
      WVJBIframe.style.display = 'none';
      WVJBIframe.src = 'wvjbscheme://__BRIDGE_LOADED__';
      document.documentElement.appendChild(WVJBIframe);
      setTimeout(() => document.documentElement.removeChild(WVJBIframe), 0);
    };

    initializeBridge();

    // Cleanup
    return () => {
      window.WVJBCallbacks = undefined;
    };
  }, []);

  const fetchCurrentLocation = async () => {
    // Clear previous errors
    setError(null);

    try {
      // Try WebView bridge first if available
      if (bridgeReady && window.WebViewJavascriptBridge) {
        return new Promise((resolve, reject) => {
          window.WebViewJavascriptBridge.callHandler(
            'requestLocation',
            null,
            (response) => {
              try {
                const locationData = typeof response === 'string' 
                  ? JSON.parse(response) 
                  : response;

                if (locationData?.latitude && locationData?.longitude) {
                  const location = {
                    latitude: Number(locationData.latitude),
                    longitude: Number(locationData.longitude)
                  };
                  resolve(location);
                } else {
                  reject(new Error('Invalid location data from WebView'));
                }
              } catch (e) {
                reject(new Error(`Failed to parse WebView location: ${e.message}`));
              }
            }
          );
        });
      }

      // Fallback to browser geolocation
      if ("geolocation" in navigator) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      }

      throw new Error('No location services available');

    } catch (err) {
      let errorMessage = 'Failed to get location';
      
      if (err.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please check GPS settings.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out. Please retry.';
      }

      setError(errorMessage);
      throw err;
    }
  };

  const updateLocation = async () => {
    try {
      const location = await fetchCurrentLocation();
      
      setCurrentLocation(location);
      setViewState(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      
      setPath(prevPath => [...prevPath, [location.longitude, location.latitude]]);
      
      if (isTracking) {
        setStopovers(prev => [...prev, location]);
      }
    } catch (err) {
      console.error('Error updating location:', err);
    }
  };

  // Initialize location tracking
  useEffect(() => {
    let locationInterval;

    const startTracking = async () => {
      if (isTracking) {
        await updateLocation();
        locationInterval = setInterval(updateLocation, 10000); // Update every 10 seconds
      }
    };

    startTracking();

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [isTracking]);

  const startLocationListener = async () => {
    try {
      // Clear previous path and errors
      setPath([]);
      setError(null);
      
      // Get initial location
      await updateLocation();
      
      setIsTracking(true);

      // Notify WebView if bridge is available
      if (bridgeReady && window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler('startLocationListener', '');
      }
    } catch (err) {
      console.error('Failed to start location tracking:', err);
      setError('Failed to start location tracking. Please check permissions and try again.');
    }
  };

  const stopLocationListener = () => {
    setIsTracking(false);
    if (bridgeReady && window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler('stopLocationListener', '');
    }
  };

  // Rest of the render code remains the same
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
              <AlertDescription>
                {error}
                <Button
                  onClick={() => updateLocation()}
                  className="mt-4 bg-oves-blue text-white"
                >
                  Retry
                </Button>
              </AlertDescription>
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