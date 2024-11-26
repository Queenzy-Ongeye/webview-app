import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import BleDataPage from "./BleDataPage";

const BleButtons = () => {
  const { dispatch, state } = useStore();
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null);
  const [loadingMap, setLoadingMap] = useState(new Map());
  const [error, setError] = useState(null);
  const [showBleDataPage, setShowBleDataPage] = useState(false); // Control rendering of BleDataPage
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("all");

  // Helper to check if any device is loading
  const isAnyDeviceLoading = () => {
    return Array.from(loadingMap.values()).some((isLoading) => isLoading);
  };

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  state.detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  const uniqueDevice = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  // Filter and sort devices based on the current filter
  const filteredAndSortedDevices = useMemo(() => {
    let devices = Array.from(uniqueDevicesMap.values());

    switch (currentFilter) {
      case "strong":
        return devices
          .filter((device) => device.rssi > -70)
          .sort((a, b) => b.rssi - a.rssi);
      case "medium":
        return devices
          .filter((device) => device.rssi <= -70 && device.rssi > -90)
          .sort((a, b) => b.rssi - a.rssi);
      case "weak":
        return devices
          .filter((device) => device.rssi <= -90)
          .sort((a, b) => b.rssi - a.rssi);
      default:
        return devices.sort((a, b) => b.rssi - a.rssi);
    }
  }, [uniqueDevicesMap, currentFilter]);

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
  };

  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "bleConnectSuccessCallBack",
        (data, responseCallback) => {
          const macAddress = data.macAddress;
          if (macAddress) {
            initBleData(macAddress);
          } else {
            console.error(
              "MAC Address not found in successful connection data:",
              data
            );
          }
          responseCallback(data);
        }
      );
    }
  }, []);

  // Watch for changes in initBleData and trigger navigation
  useEffect(() => {
    if (state.initBleData?.dataList && !isNavigating) {
      console.log("Data detected, preparing to navigate:", state.initBleData);
      performNavigation();
    }
  }, [state.initBleData]);

  const performNavigation = () => {
    if (isNavigating) return; // Prevent multiple navigations

    console.log("Attempting navigation with data:", {
      initBleData: state.initBleData,
      dataList: state.initBleData?.dataList,
    });

    setIsNavigating(true);

    try {
      if (state.initBleData?.dataList) {
        // Ensure we have the data before navigating
        const deviceData = state.initBleData.dataList;

        // Use a short timeout to ensure state updates have completed
        setTimeout(() => {
          console.log("Navigating to /ble-data with data:", deviceData);
          navigate("/ble-data", {
            state: { deviceData },
            replace: true, // Use replace to prevent back navigation issues
          });
        }, 3000);
      } else {
        throw new Error("Navigation attempted without valid data");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setError(`Failed to navigate: ${error.message}`);
      setIsNavigating(false);
    }
  };

  const handleConnectAndInit = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setShowBleDataPage(false); // Hide BleDataPage initially

    // Mark the device as loading
    setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
    setConnectingMacAddress(macAddress);

    try {
      console.log("Starting connection process for:", macAddress);
      const connectionResult = await connectToBluetoothDevice(macAddress);
      console.log("Connection result:", connectionResult);

      // Simulate stabilization time
      await new Promise((resolve) => setTimeout(resolve, 25000));

      console.log("Starting BLE data initialization");
      const response = await initBleData(macAddress);
      console.log("BLE initialization response:", response);

      dispatch({ type: "SET_INIT_BLE_DATA", payload: response });
      setConnectionSuccessMac(macAddress);
      setInitSuccessMac(macAddress);

      // Show BleDataPage after successful initialization
      setShowBleDataPage(true);
    } catch (error) {
      console.error("Connection/initialization error:", error);
      setError(error.message || "Failed to connect and initialize BLE data");
    } finally {
      // Clean up loading states after a delay
      setTimeout(() => {
        setConnectingMacAddress(null);
        setLoadingMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.delete(macAddress);
          return newMap;
        });
      }, 50000);
    }
  };

  const connectToBluetoothDevice = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      console.log("Attempting to connect to device:", macAddress);

      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          try {
            console.log("Raw connection response:", responseData);
            const parsedData = JSON.parse(responseData);
            console.log("Parsed connection response:", parsedData);

            if (parsedData.respCode === "200") {
              resolve(parsedData);
            } else {
              reject(
                new Error(
                  `Connection failed: ${parsedData.respMsg || "Unknown error"}`
                )
              );
            }
          } catch (error) {
            console.error("Error parsing connection response:", error);
            reject(
              new Error(`Failed to parse connection response: ${error.message}`)
            );
          }
        }
      );
    });
  };

  const initBleData = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      console.log("Initializing BLE data for:", macAddress);

      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            console.log("Raw init response:", responseData);
            const parsedData = JSON.parse(responseData);
            console.log("Parsed init response:", parsedData);

            // if (!parsedData || !parsedData.dataList) {
            //   reject(new Error("Invalid initialization response format"));
            //   return;
            // }

            resolve(parsedData);
          } catch (error) {
            console.error("Error parsing init response:", error);
            reject(
              new Error(
                `Failed to parse initialization response: ${error.message}`
              )
            );
          }
        }
      );
    });
  };

  // Function to initiate the QR/barcode scan
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      try {
        window.WebViewJavascriptBridge.callHandler(
          "startQrCodeScan",
          999,
          (responseData) => {
            const parsedResponse = JSON.parse(responseData);
            // Check if the scan initiation was successful
            if (
              parsedResponse.respCode === "200" &&
              parsedResponse.respData === true
            ) {
              console.log("Scan started successfully.");
            } else {
              console.error("Failed to start scan:", parsedResponse.respDesc);
              alert("Failed to start scan. Please try again.");
            }
          }
        );
      } catch (error) {
        console.error("Error starting QR code scan:", error.message);
      }
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  return (
    <div className="scan-data-page flex flex-col h-screen mt-10 w-full relative">
      {/* Background with BleDataPage when loading */}
      {isAnyDeviceLoading() && (
        <div className="absolute inset-0 z-10 opacity-75">
          <BleDataPage />
        </div>
      )}

      {/* Device List */}
      <div
        className={`${
          isAnyDeviceLoading() ? "hidden" : "block"
        } min-h-screen bg-gray-100 w-full relative z-0`}
      >
        {error && (
          <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="p-2">
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-300"
                >
                  <span className="mr-1">↑↓</span>
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleFilterChange("all")}>
                  All Signals
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("strong")}>
                  Strong Signal (-70 dBm)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("medium")}>
                  Medium Signal (-90 to -70 dBm)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("weak")}>
                  Weak Signal ( -90 dBm)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300"
              onClick={startQrCodeScan}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          {filteredAndSortedDevices.length > 0 ? (
            <ul className="text-left">
              {filteredAndSortedDevices.map((device) => (
                <li
                  key={device.macAddress}
                  className="mt-2 p-2 border rounded-md shadow flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-700">
                      {device.name || "Unknown Device"}
                    </p>
                    <p className="text-gray-700">{device.macAddress}</p>
                    <div className="flex items-left">
                      {device.rssi > -50 ? (
                        <Wifi className="text-green-500" />
                      ) : device.rssi > -70 ? (
                        <Wifi className="text-yellow-500" />
                      ) : (
                        <WifiOff className="text-red-500" />
                      )}
                      <span className="text-sm text-gray-500">
                        {device.rssi}dBm
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleConnectAndInit(e, device.macAddress)}
                    className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 ${
                      loadingMap.get(device.macAddress)
                        ? "bg-gray-400 text-gray-800 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                    disabled={loadingMap.get(device.macAddress)}
                  >
                    {loadingMap.get(device.macAddress) ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      "Connect"
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No BLE devices detected.</p>
          )}
        </div>
      </div>

      {/* Loading Spinner Overlay */}
      {isAnyDeviceLoading() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BleButtons;
