import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { Loader2, Wifi, WifiOff } from "lucide-react";

const BleButtons = ({
  connectToBluetoothDevice,
  initBleData,
  detectedDevices,
  initBleDataResponse,
  isLoading,
}) => {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null); // Track successful connection per MAC
  const [initSuccessMac, setInitSuccessMac] = useState(null); // Track successful initialization per MAC
  const [loadingMap, setLoadingMap] = useState(new Map()); // Track loading per device

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  // Convert the Map to an array and sort by signal strength (RSSI)
  const uniqueDevice = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  // Initiate device pairing process
  const handleConnectAndInit = async (e, macAddress) => {
    e?.preventDefault();
    e?.stopPropagation();

    // Update loading state for the specific device
    setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
    setConnectingMacAddress(macAddress);

    try {
      console.log("Connecting to Bluetooth device", macAddress);
      await connectToBluetoothDevice(macAddress);

      // Add delay and initialize BLE data as in your original code...
      setTimeout(async () => {
        console.log("Starting BLE data initialization after delay");

        // Step 3: Initialize BLE data after the delay
        const response = await initBleData(macAddress);
        dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });
        console.log("Initialized BLE data:", response);

        // Step 4: Set successful states for UI feedback
        setConnectionSuccessMac(macAddress);
        setInitSuccessMac(macAddress);
        // Step 4: Navigate to DeviceDataPage with combined data

        setTimeout(() => {
          navigateToPage("/ble-data");
        }, 50000);
        // Clear success states after another delay
        setTimeout(() => {
          setConnectionSuccessMac(null);
          setInitSuccessMac(null);
        }, 10000); // Clear after 10 seconds
      }, 25000); // 3-second delay before starting BLE initialization

      // Wait and then search for match as in your original code...
    } catch (error) {
      console.error(
        "Error during Bluetooth connection or BLE data initialization:",
        error
      );
      alert("Failed to connect and initialize BLE data. Please try again.");
    } finally {
      setTimeout(() => {
        setConnectingMacAddress(null);
        // Clear loading state for the specific device
        setLoadingMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(macAddress, false);
          return newMap;
        });
      }, 80000);
    }
  };

  const navigateToPage = (page) => {
    if (!initBleDataResponse) {
      console.error("No data to navigate with.");
      return;
    }
    // Pass valid data structure to BleDataPage
    navigate(page, { state: initBleDataResponse });
  };

  // Helper function to check if any device is loading
  const isAnyDeviceLoading = () => {
    return Array.from(loadingMap.values()).some((isLoading) => isLoading);
  };

  return (
    <div className="scan-data-page flex flex-col h-screen mt-4">
      <div className="min-h-screen bg-gray-100">
        <div className="p-2">
          {uniqueDevice.map((device, index) => (
            <div
              key={index}
              className="bg-white rounded-sm shadow-sm w-full p-4 mb-4 flex items-left"
            >
              <div className="ml-4 flex-1">
                <h2 className="text-lg font-semibold">{device.name}</h2>
                <div className="flex items-left">
                  {device.rssi > -50 ? (
                    <Wifi className="text-green-500" />
                  ) : device.rssi > -70 ? (
                    <Wifi className="text-yellow-500" />
                  ) : (
                    <WifiOff className="text-red-500" />
                  )}
                  <span className="text-sm text-gray-500">
                    Signal Strength: {device.rssi}dBm
                  </span>
                </div>
                <p className="text-sm text-gray-500">{device.energyType}</p>
                <p className="text-sm text-gray-500">{device.macAddress}</p>
              </div>
              <button
                onClick={(e) => handleConnectAndInit(e, device.macAddress)}
                className={`px-4 py-2 text-white rounded-md ml-4 transition-colors duration-300 ${
                  loadingMap.get(device.macAddress)
                    ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                    : "bg-cyan-700 text-white"
                }`}
                disabled={loadingMap.get(device.macAddress)}
              >
                {loadingMap.get(device.macAddress)
                  ? "Processing..."
                  : "Connect"}
              </button>
              <button
                onClick={(e) => handleConnectAndInit(e, macAddress)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium border rounded-md transition-colors duration-300 bg-oves-blue text-white hover:bg-oves-blue/90 focus:outline-none focus:ring-2 focus:ring-oves-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
      {isAnyDeviceLoading() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Connecting to device...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BleButtons;
