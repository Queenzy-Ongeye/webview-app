import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import PopupNotification from "../notification/PopUp";
import { useNavigate } from "react-router-dom";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingMap, setLoadingMap] = useState(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(null);
  const requestCode = 999;
  const navigate = useNavigate();

  // Function to handle "View Device Data" button click when match is found
  const handleContinue = () => {
    if (matchFound && state.initBleData) {
      navigate("/ble-data", {
        state: { deviceData: state.initBleData.dataList },
      });
    }
    setPopupVisible(false);
  };

  // Start scanning for BLE devices
  const scanBleDevices = () => {
    setIsScanning(true);
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        null,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData && parsedData.devices) {
              dispatch({
                type: "ADD_DETECTED_DEVICE",
                payload: parsedData.devices,
              });
              // After scanning, initiate the automated process if we have scanned data
              if (state.scannedData) {
                initiateDeviceQueue(parsedData.devices);
              }
            }
          } catch (error) {
            console.error("Error parsing BLE scan data:", error.message);
          } finally {
            setIsScanning(false);
          }
        }
      );
    }
  };

  // Initiate the device queue based on signal strength
  const initiateDeviceQueue = (devices) => {
    if (devices && devices.length > 0) {
      const sortedDevices = devices
        .sort((a, b) => b.rssi - a.rssi)
        .map(device => device.macAddress);
      setDeviceQueue(sortedDevices);
      setCurrentDeviceIndex(0);
      setIsProcessing(true);
    }
  };

  // Connect to a device and initialize it
  const connectAndInitDevice = async (macAddress) => {
    setLoadingMap(prev => new Map(prev.set(macAddress, true)));
    
    try {
      // Connect to device
      const connected = await connectToBluetoothDevice(macAddress);
      if (!connected) {
        throw new Error("Connection failed");
      }

      // Wait for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Initialize BLE data
      const bleData = await initBleData(macAddress);
      dispatch({ type: "SET_INIT_BLE_DATA", payload: bleData });

      // Search for match
      const hasMatch = await searchForMatch(bleData);
      
      if (hasMatch) {
        setMatchFound(true);
        setPopupVisible(true);
        setIsProcessing(false);
      } else {
        // Move to next device
        setCurrentDeviceIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error during device processing:", error);
      // Move to next device on error
      setCurrentDeviceIndex(prev => prev + 1);
    } finally {
      setLoadingMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(macAddress);
        return newMap;
      });
    }
  };

  // Connect to Bluetooth device
  const connectToBluetoothDevice = (macAddress) => {
    return new Promise((resolve) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "connBleByMacAddress",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              resolve(parsedData.respCode === "200");
            } catch (error) {
              resolve(false);
            }
          }
        );
      } else {
        resolve(false);
      }
    });
  };

  // Initialize BLE data
  const initBleData = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "initBleData",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              resolve(parsedData);
            } catch (error) {
              reject(error);
            }
          }
        );
      } else {
        reject(new Error("Bridge not initialized"));
      }
    });
  };

  // Search for a match in the BLE data
  const searchForMatch = (bleData) => {
    return new Promise((resolve) => {
      if (!bleData || !state.scannedData) {
        resolve(false);
        return;
      }

      for (const item of bleData.dataList || []) {
        for (const characteristic of Object.values(item.characterMap || {})) {
          const { realVal, desc } = characteristic;
          if (
            (realVal && realVal.toString().includes(state.scannedData)) ||
            (desc && desc.includes(state.scannedData))
          ) {
            resolve(true);
            return;
          }
        }
      }
      resolve(false);
    });
  };

  // Effect to handle the automated process
  useEffect(() => {
    if (isProcessing && deviceQueue.length > 0 && currentDeviceIndex < deviceQueue.length) {
      connectAndInitDevice(deviceQueue[currentDeviceIndex]);
    } else if (isProcessing && currentDeviceIndex >= deviceQueue.length) {
      // We've tried all devices and found no match
      setMatchFound(false);
      setPopupVisible(true);
      setIsProcessing(false);
    }
  }, [isProcessing, currentDeviceIndex, deviceQueue]);

  // Effect to start scanning when needed
  useEffect(() => {
    if (state.scannedData && (!state.detectedDevices || state.detectedDevices.length === 0)) {
      scanBleDevices();
    }
  }, [state.scannedData]);

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  state.detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  // Convert the Map to an array and sort by signal strength (RSSI)
  const uniqueDevices = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  return (
    <div className="scan-data-page flex flex-col h-screen mt-2">
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-left">Scanned Data</h2>
        {state.scannedData && (
          <p className="text-left mt-2">Barcode Number: {state.scannedData}</p>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-left">
            Detected BLE Devices:
          </h3>
          {uniqueDevices.length > 0 ? (
            <ul className="text-left">
              {uniqueDevices.map((device) => (
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
                  {loadingMap.get(device.macAddress) && (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No BLE devices detected.</p>
          )}
        </div>

        <button
          onClick={startQrCodeScan}
          className="fixed bottom-20 right-3 w-16 h-16 bg-oves-blue rounded-full shadow-lg flex items-center justify-center"
        >
          <IoQrCodeOutline className="text-2xl text-white" />
        </button>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">
              Scanning device {currentDeviceIndex + 1} of {deviceQueue.length}...
            </p>
          </div>
        </div>
      )}

      {isPopupVisible && (
        <PopupNotification
          matchFound={matchFound}
          onClose={() => setPopupVisible(false)}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
};

export default ScanDataPage;