import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Notification from "../notification/Notification";
import PopupNotification from "../notification/PopUp";
import { useNavigate } from "react-router-dom";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [initializingMacAddress, setInitializingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null);
  const [successMac, setSuccessMac] = useState(null);
  const [loading, setLoading] = useState(false);
  const requestCode = 999;
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(null);
  const navigate = useNavigate();
  const [activeMacAddress, setActiveMacAddress] = useState(null); // Track active MAC address
  const [failedMacAddress, setFailedMacAddress] = useState(null); // Track failed connections
  const [searchingMatch, setSearchingMatch] = useState(false);
  const [progress, setProgress] = useState(0);

  // Handle search result
  const handleMatchResult = (found, deviceData = null) => {
    setMatchFound(found);
    if (found) {
      setPopupVisible(true);
      dispatch({ type: "SET_MATCHING_DEVICE", payload: deviceData });
    }
  };

  // Function to handle "View Device Data" button click when match is found
  const handleContinue = () => {
    if (matchFound && state.initBleData) {
      navigate("/device-data", { state: { deviceData: state.initBleData } }); // Pass data to new page
    }
    setPopupVisible(false); // Close the popup
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

  // Register the callback handler for the scan result
  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            const scannedValue = parsedData.respData?.value;
            const callbackRequestCode = parsedData.respData?.requestCode;

            // Validate the request code to ensure it matches the original request
            if (callbackRequestCode === requestCode) {
              console.log("Scanned data received:", scannedValue);
              handleScanData(scannedValue); // Process the scanned data
            } else {
              console.error(
                "Request code mismatch. Expected:",
                requestCode,
                "Received:",
                callbackRequestCode
              );
            }
          } catch (error) {
            console.error(
              "Error processing scan callback data:",
              error.message
            );
          }
        }
      );
    }
  }, []);

  // Function to handle the scanned data after receiving it
  const handleScanData = (scannedValue) => {
    if (scannedValue) {
      console.log("Scanned Value:", scannedValue);
      dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });
      initiateDeviceQueue(); // Start pairing process
    } else {
      console.error("Invalid scan data received.");
      alert("Invalid scan data. Neither a barcode nor a QR code.");
    }
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
          if (parsedData.respCode === 200) {
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

  // Handle connect and initialization in one function with proper async handling
  const handleConnectAndInit = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setConnectingMacAddress(macAddress);
    setLoading(true);
    setProgress(0); // Reset progress on each call

    try {
      // Phase 1: Connection
      const connectionResult = await connectToBluetoothDevice(macAddress);
      if (!connectionResult) {
        throw new Error("Failed to connect to Bluetooth device");
      }
      console.log("Connected to Bluetooth device:", macAddress);

      setTimeout(() => {
        setConnectionSuccessMac(macAddress);
        setTimeout(() => setConnectionSuccessMac(null), 10000); // Clear success after 10 seconds
      }, 23000);
      // Phase 2: Initialization with progress simulation
      let progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prevProgress + 5;
        });
      }, 1500);

      const initResult = await initBleData(macAddress);
      if (!initResult) {
        throw new Error("Failed to initialize BLE data");
      }
      dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: initResult });

      setTimeout(() => {
        setInitSuccessMac(macAddress);
        setTimeout(() => setInitSuccessMac(null), 10000); // Clear success after 10 seconds
      }, 35000);

      // Proceed to search for a match only after initialization
      searchForMatch();
    } catch (error) {
      console.error("Error in connection or initialization:", error);
      alert("An error occurred. Please try again.");
      setConnectionSuccessMac(null);
      setInitSuccessMac(null);
    } finally {
      setConnectingMacAddress(null);
      setInitializingMacAddress(null);
      setLoading(false);
      setProgress(0); // Reset progress after completion
    }
  };

  // Updated async functions for connection and initialization
  const connectToBluetoothDevice = async (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "connBleByMacAddress",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              if (parsedData.respCode === "200") {
                resolve(true);
              } else {
                reject(
                  new Error(
                    "Connection failed with response code " +
                      parsedData.respCode
                  )
                );
              }
            } catch (error) {
              console.error("Error parsing connection response:", error);
              reject(error);
            }
          }
        );
      } else {
        console.error("WebViewJavascriptBridge is not initialized.");
        reject(new Error("WebViewJavascriptBridge is not initialized"));
      }
    });
  };

  const initBleData = async (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "initBleData",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              if (parsedData) {
                resolve(parsedData);
              } else {
                reject(new Error("Initialization response data is invalid"));
              }
            } catch (error) {
              console.error("Error parsing initialization response:", error);
              reject(error);
            }
          }
        );
      } else {
        console.error("WebViewJavascriptBridge is not initialized.");
        reject(new Error("WebViewJavascriptBridge is not initialized"));
      }
    });
  };

  // Search for a match in the BLE data once initialized
  const searchForMatch = () => {
    const { initBleData, scannedData } = state;
    if (!initBleData || !scannedData) {
      handleMatchResult(false);
      return;
    }

    let match = false;
    let foundDeviceData = null;
    for (const item of initBleData.dataList || []) {
      for (const characteristic of Object.values(item.characterMap || {})) {
        const { realVal, desc } = characteristic;
        if (
          (realVal && realVal.toString().includes(scannedData)) ||
          (desc && desc.includes(scannedData))
        ) {
          match = true;
          foundDeviceData = item;
          break;
        }
      }
      if (match) break;
    }
    handleMatchResult(match, foundDeviceData);
  };

  // useEffect hook to monitor initBleData and scannedData changes
  // useEffect(() => {
  //   if (state.initBleData && state.scannedData && !isPopupVisible) {
  //     // Run the search only when both initBleData and scannedData are available
  //     searchForMatch();
  //   }
  // }, [state.initBleData, state.scannedData]);
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
    uniqueDevicesMap.set(device.macAddress, device);
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
          <p className="text-left mt-2">Barcode Number: {state.scannedData}</p>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-left">
            Detected BLE Devices:
          </h3>
          {uniqueDevice.length > 0 ? (
            <ul className="text-left fle">
              {uniqueDevice.map((device, index) => (
                <React.Fragment key={device.macAddress}>
                  <li className="mt-2 p-2 border rounded-md shadow flex items-center justify-between">
                    <div>
                      <p className="text-gray-700">
                        {device.name || "Unknown Device"}
                      </p>
                      <p className="text-gray-700">
                        Mac-Address: {device.macAddress}
                      </p>
                      <p className="text-gray-700">
                        Signal Strength: {device.rssi}db
                      </p>
                    </div>
                    {/* Enhanced button with better state handling */}
                    <button
                      onClick={(e) =>
                        handleConnectAndInit(e, device.macAddress)
                      }
                      className={`w-full px-4 py-2 border rounded-md ${
                        connectingMacAddress === device.macAddress
                          ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                          : connectionSuccessMac === device.macAddress
                          ? "bg-green-500 text-white"
                          : initializingMacAddress === device.macAddress
                          ? "bg-yellow-500 text-white cursor-not-allowed animate-pulse"
                          : initSuccessMac === device.macAddress
                          ? "bg-green-500 text-white"
                          : "bg-oves-blue text-white"
                      }`}
                      disabled={
                        loading ||
                        connectingMacAddress === device.macAddress ||
                        initializingMacAddress === device.macAddress
                      }
                    >
                      {connectingMacAddress === device.macAddress
                        ? "Connecting..."
                        : connectionSuccessMac === device.macAddress
                        ? "Connected"
                        : initializingMacAddress === device.macAddress
                        ? "Initializing..."
                        : initSuccessMac === device.macAddress
                        ? "Initialized"
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

        <button
          onClick={startQrCodeScan}
          className="fixed bottom-20 right-3 w-16 h-16 bg-blue-600 rounded-full shadow-lg flex items-center justify-center"
        >
          <IoQrCodeOutline className="text-2xl text-white" />
        </button>
      </div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white" />
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
