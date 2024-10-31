import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loading.json";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [initializingMacAddress, setInitializingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null);
  const [loading, setLoading] = useState(false);

  // Combined function for Bluetooth actions: connect or initialize
  const handleConnectClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setConnectingMacAddress(macAddress);
    setLoading(true); // Start loading indicator for the connection process

    try {
      // Attempt to connect to the Bluetooth device
      await connectToBluetoothDevice(macAddress);
      console.log("Connected to Bluetooth device", macAddress);

      // If the connection is successful, set the success state for the current MAC
      setTimeout(() => {
        setConnectionSuccessMac(macAddress);
        setTimeout(() => setConnectionSuccessMac(null), 10000); // Clear success state after 10 seconds
      }, 23000);
    } catch (error) {
      // If the connection fails, log the error and show an alert
      console.error("Error connecting to Bluetooth device:", error);
      alert("Failed to connect to Bluetooth device. Please try again.");

      // Ensure that the success state is not set in case of failure
      setConnectionSuccessMac(null); // Clear any success indicator
    } finally {
      setTimeout(() => {
        setConnectingMacAddress(null);
        setLoading(false);
      }, 23000);
    }
  };

  const handleInitBleDataClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setInitializingMacAddress(macAddress);
    setLoading(true);

    try {
      const response = await initBleData(macAddress);
      dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });

      // If initialization is successful, set the success state for the current MAC
      setTimeout(() => {
        setInitSuccessMac(macAddress);
        setTimeout(() => setInitSuccessMac(null), 10000); // Clear success state after 10 seconds
      }, 35000);
    } catch (error) {
      console.error("Error during BLE Data Initialization:", error);
      alert("Failed to initialize BLE data. Please try again.");

      // Ensure that the success state is not set in case of failure
      setInitSuccessMac(null);
    } finally {
      setTimeout(() => {
        setInitializingMacAddress(null);
        setLoading(false);
      }, 35000);
    }
  };

  // Function to handle scanned data and start pairing process
  const handleScanData = (scannedValue) => {
    console.log("Scanned Value:", scannedValue);
    setScannedBarcode(scannedValue);
    initiateDeviceQueue(); // Initialize device queue
  };

  // Initiate the device queue based on the top 5 strongest signals
  const initiateDeviceQueue = () => {
    const detectedDevices = state.detectedDevices;
    if (detectedDevices && detectedDevices.length > 0) {
      const topDevices = detectedDevices
        .sort((a, b) => b.rssi - a.rssi)
        .slice(0, 5);
      setDeviceQueue(topDevices.map((device) => device.macAddress)); // Queue MAC addresses
      connectToNextDevice(); // Start the pairing process
    } else {
      console.warn("No BLE devices detected.");
    }
  };

  // Attempt to connect to the next device in the queue
  const connectToNextDevice = () => {
    if (deviceQueue.length === 0) {
      alert("No matching device found. Please scan again.");
      return;
    }

    const nextDeviceMac = deviceQueue[0];
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        nextDeviceMac,
        (responseData) => {
          const parsedData = JSON.parse(responseData);
          if (parsedData.respCode === "200") {
            initBleData(nextDeviceMac);
          } else {
            alert("Connection failed. Trying next device...");
            setDeviceQueue((prevQueue) => prevQueue.slice(1)); // Remove current device and retry
            connectToNextDevice();
          }
        }
      );
    }
  };

  // Initialize and check BLE data for a barcode match
  const initBleData = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          const parsedData = JSON.parse(responseData);
          const matchingDevice = findMatchingDevice(parsedData, scannedBarcode);

          if (matchingDevice) {
            console.log("Matching BLE device found:", matchingDevice);
            dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
          } else {
            alert("No match found. Trying next device...");
            setDeviceQueue((prevQueue) => prevQueue.slice(1)); // Continue with next device
            connectToNextDevice();
          }
        }
      );
    }
  };

  // Helper function to recursively search for a value within an object
  const recursiveSearch = (obj, searchValue) => {
    if (typeof obj === "string" || typeof obj === "number") {
      // Convert both to strings for comparison
      return obj.toString() === searchValue.toString();
    } else if (Array.isArray(obj)) {
      // If obj is an array, recursively search each item
      return obj.some((item) => recursiveSearch(item, searchValue));
    } else if (typeof obj === "object" && obj !== null) {
      // If obj is an object, recursively search each property
      return Object.values(obj).some((value) =>
        recursiveSearch(value, searchValue)
      );
    }
    return false;
  };

  // Modified function to find a matching device by searching dynamically through all metadata
  const findMatchingDevice = (deviceData, scannedData) => {
    return deviceData.dataList.find((device) => {
      return device.services.some((service) => {
        return Object.keys(service.characterMap).some((charUuid) => {
          const characteristic = service.characterMap[charUuid];
          return recursiveSearch(characteristic, scannedData); // Dynamically search characteristic metadata
        });
      });
    });
  };

  // Start QR code scan
  const startQrCodeScan = () => {
    const requestCode = 999;
    if (window.WebViewJavascriptBridge) {
      try {
        window.WebViewJavascriptBridge.callHandler(
          "startQrCodeScan",
          requestCode,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              const scannedValue = parsedData?.respData?.value;
              if (scannedValue) handleScanData(scannedValue);
            } catch (error) {
              console.error("Error parsing QR scan data:", error.message);
            }
          }
        );
        dispatch({ type: "SET_QR_SCANNING", payload: true });
      } catch (error) {
        console.error("Error starting QR scan:", error.message);
      }
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
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
            }
          } catch (error) {
            console.error("Error parsing BLE scan data:", error.message);
          } finally {
            setIsScanning(false);
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE scan.");
      setIsScanning(false);
    }
  };

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  state.detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(state.device.macAddress, device);
  });

  // Convert the Map to an array and sort by signal strength (RSSI)
  const uniqueDevice = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  useEffect(() => {
    if (!state.detectedDevices || state.detectedDevices.length === 0) {
      scanBleDevices(); // Start BLE scan if no devices are detected
    }
  }, [state.detectedDevices]);

  return (
    <div className="scan-data-page flex flex-col h-screen">
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-left">Scanned Data</h2>
        {state.scannedData && (
          <p className="text-left mt-2">{state.scannedData}</p>
        )}

        {state.matchingDevice ? (
          <div className="mt-2 text-left">
            <h3 className="text-lg font-semibold">Matching BLE Device:</h3>
            <p className="text-gray-700">Name: {state.matchingDevice.name}</p>
            <p className="text-gray-700">
              MAC Address: {state.matchingDevice.macAddress}
            </p>
          </div>
        ) : (
          <div className="mt-6 text-left">
            <p className="text-gray-500">No matching BLE device found.</p>
          </div>
        )}

        {/* Display detected BLE devices */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-left">
            Detected BLE Devices:
          </h3>
          {uniqueDevice && uniqueDevice.length > 0 ? (
            <ul className="text-left">
              {uniqueDevice.map((device, index) => (
                <>
                  <li key={index} className="mt-2 p-2 border rounded-md shadow">
                    <p className="text-gray-700">
                      {device.name || "Unknown Device"}
                    </p>
                    <p className="text-gray-700">{device.macAddress}</p>
                    <p className="text-gray-700">
                      Signal Strength: {device.rssi}
                    </p>
                  </li>
                  <li className="flex justify-between w-full mt-4 space-x-2">
                    <button
                      onClick={(e) => handleConnectClick(e, device.macAddress)}
                      className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                        connectingMacAddress === device.macAddress
                          ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                          : connectionSuccessMac === device.macAddress
                          ? "bg-green-500 text-white"
                          : "bg-cyan-600 text-white hover:bg-cyan-700"
                      }`}
                      disabled={
                        isLoading || connectingMacAddress === device.macAddress
                      }
                    >
                      {connectingMacAddress === device.macAddress
                        ? "Connecting..."
                        : connectionSuccessMac === device.macAddress
                        ? "Connected"
                        : "Connect"}
                    </button>
                    <button
                      onClick={(e) =>
                        handleInitBleDataClick(e, device.macAddress)
                      }
                      className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                        initializingMacAddress === device.macAddress
                          ? "bg-gray-500 text-white cursor-not-allowed animate-pulse"
                          : initSuccessMac === device.macAddress
                          ? "bg-green-500 text-white"
                          : "bg-cyan-700 text-white"
                      }`}
                      disabled={
                        isLoading ||
                        initializingMacAddress === device.macAddress
                      }
                    >
                      {initializingMacAddress === device.macAddress
                        ? "Initializing..."
                        : initSuccessMac === device.macAddress
                        ? "Initialized"
                        : "Init BLE Data"}
                    </button>
                  </li>
                </>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No BLE devices detected.</p>
          )}
          {loading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white" />
            </div>
          )}
        </div>

        {(!state.detectedDevices || state.detectedDevices.length === 0) && (
          <div className="mt-10 text-center">
            {isScanning ? (
              <>
                <Lottie
                  animationData={loadingAnimation}
                  loop={true}
                  className="w-32 h-32 mx-auto"
                />
                <p className="text-lg text-gray-600 mt-4">
                  Scanning for BLE devices...
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-gray-600">No BLE devices found.</p>
                <button
                  onClick={scanBleDevices}
                  className="mt-4 px-6 py-2 bg-oves-blue text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                >
                  <FiRefreshCw className="mr-2" />
                  Retry Scan
                </button>
              </>
            )}
          </div>
        )}

        <button
          onClick={startQrCodeScan}
          className="fixed bottom-20 right-3 w-16 h-16 bg-oves-blue rounded-full shadow-lg flex items-center justify-center"
        >
          <IoQrCodeOutline className="text-2xl text-white" />
        </button>
      </div>
    </div>
  );
};

export default ScanDataPage;
