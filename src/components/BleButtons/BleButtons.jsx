import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { Loader2, Wifi, WifiOff } from "lucide-react";

const BleButtons = () => {
  const { dispatch, state } = useStore();
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null); // Track successful connection per MAC
  const [initSuccessMac, setInitSuccessMac] = useState(null); // Track successful initialization per MAC
  const [loadingMap, setLoadingMap] = useState(new Map()); // Track loading per device

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  state.detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  // Convert the Map to an array and sort by signal strength (RSSI)
  const uniqueDevice = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  const navigatePage = () => {
    if (state.initBleData) {
      navigate("/ble-data", {
        state: { deviceData: state.initBleData.dataList },
      });
    } else {
      log("Response data is not found:", !state.initBleData.dataList);
    }
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

  // Initiate device pairing process
  const handleConnectAndInit = async (e, macAddress) => {
    e?.preventDefault();
    e?.stopPropagation();

    // Update loading state for the specific device
    setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
    setConnectingMacAddress(macAddress);

    try {
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

  const connectToBluetoothDevice = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "connBleByMacAddress",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              if (parsedData.respCode === "200") {
                initBleData(macAddress);
                resolve(true); // Resolve with success
              } else {
                reject("Connection failed");
              }
            } catch (error) {
              console.error("Error parsing JSON data:", error);
              reject(error);
            }
          }
        );
      } else {
        console.error("WebViewJavascriptBridge is not initialized.");
        reject("WebViewJavascriptBridge not initialized");
      }
    });
  };

  const initBleData = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "initBleData",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
              console.log("BLE Init Data:", parsedData);
              resolve(parsedData); // Resolve the promise with the retrieved data
            } catch (error) {
              console.error(
                "Error parsing JSON data from 'initBleData' response:",
                error
              );
              reject(error);
            }
          }
        );
      } else {
        console.error("WebViewJavascriptBridge is not initialized.");
        reject("WebViewJavascriptBridge not initialized");
      }
    });
  };

  // Helper function to check if any device is loading
  const isAnyDeviceLoading = () => {
    return Array.from(loadingMap.values()).some((isLoading) => isLoading);
  };

  return (
    <div className="scan-data-page flex flex-col h-screen mt-6 w-full">
      <div className="min-h-screen bg-gray-100 w-full">
        <div className="p-2">
          {uniqueDevice.length > 0 ? (
            <ul className="text-left">
              {uniqueDevice.map((device, index) => (
                <React.Fragment key={device.macAddress}>
                  <li className="mt-2 p-2 border rounded-md shadow flex items-center justify-between">
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
                      onClick={(e) =>
                        handleConnectAndInit(e, device.macAddress)
                      }
                      className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 ${
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
                  </li>
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No BLE devices detected.</p>
          )}
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
