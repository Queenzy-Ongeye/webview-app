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

  const handleMatchResult = (found) => {
    setMatchFound(found);
    setPopupVisible(true);
    setLoading(false);
  };

  // Function to handle "View Device Data" button click when match is found
  const handleContinue = () => {
    if (matchFound && initBleData) {
      navigate("/device-data", { state: { deviceData: initBleData } }); // Pass data to new page
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

  const handleConnectAndInitClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveMacAddress(macAddress);
    setFailedMacAddress(null);
    setLoading(true);

    try {
      // Step 1: Connect to the Bluetooth device
      const connectionSuccess = await connectToBluetoothDevice(macAddress);
      console.log("Connection attempt response:", connectionSuccess);

      if (connectionSuccess) {
        console.log("Connected to Bluetooth device:", macAddress);
        setConnectionSuccessMac(macAddress); // Track successful connection

        // Step 2: Initialize BLE Data after successful connection
        const initResponse = await initBleData(macAddress);
        console.log("Initialization response:", initResponse);

        if (initResponse && initResponse.respCode === "200") {
          setInitSuccessMac(macAddress); // Track successful initialization

          // Store the initialized data in state
          if (initResponse.respData && initResponse.respData.dataList) {
            dispatch({
              type: "SET_INIT_BLE_DATA",
              payload: initResponse.respData,
            });

            // If there's scanned data available, proceed with matching
            if (state.scannedData) {
              searchForMatch();
            }
          } else {
            console.warn("Initialization successful but no data received");
            setFailedMacAddress(macAddress);
            alert("Device connected but no data available");
          }
        } else {
          console.warn("Initialization failed:", initResponse);
          setFailedMacAddress(macAddress);
          alert("Failed to initialize device data");
        }
      } else {
        console.warn("Connection to Bluetooth device failed");
        setFailedMacAddress(macAddress);
        alert("Failed to connect to device");
      }
    } catch (error) {
      console.error("Error in connect/init process:", error);
      setFailedMacAddress(macAddress);
      alert("Error during device connection/initialization");
    } finally {
      setLoading(false);
      setActiveMacAddress(null);
    }
  };

  // Updated initBleData function with proper error handling and response parsing
  const initBleData = async (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            console.log("InitBleData response:", parsedData);

            if (!parsedData) {
              reject(new Error("No data received from initialization"));
              return;
            }

            resolve(parsedData);
          } catch (error) {
            console.error("Error parsing initBleData response:", error);
            reject(error);
          }
        }
      );
    });
  };

  // Updated connectToBluetoothDevice function with better error handling
  const connectToBluetoothDevice = async (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            console.log("Connection response:", parsedData);

            if (parsedData.respCode === "200") {
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (error) {
            console.error("Error parsing connection response:", error);
            reject(error);
          }
        }
      );
    });
  };

  // Search for a match in the BLE data once initialized
  const searchForMatch = async () => {
    setLoading(true);
    const { initBleData, scannedData } = state;

    if (!initBleData || !scannedData) {
      setLoading(false);
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
          foundDeviceData = item; // Store matched device data
          console.log("Match:", characteristic);
          break;
        }
      }
      if (match) break;
    }
    setLoading(false);
    handleMatchResult(match, foundDeviceData);
  };

  // useEffect hook to monitor initBleData and scannedData changes
  useEffect(() => {
    if (state.initBleData && state.scannedData && isPopupVisible) {
      // Run the search only when both initBleData and scannedData are available
      searchForMatch();
    }
  }, [state.initBleData, state.scannedData]);
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

  {
    /* Helper functions for button states */
  }
  const getButtonStyle = (macAddress) => {
    if (activeMacAddress === macAddress) {
      return "bg-gray-600 text-white cursor-not-allowed animate-pulse";
    }
    if (connectionSuccessMac === macAddress && !initSuccessMac) {
      return "bg-yellow-500 text-white"; // Connected but not initialized
    }
    if (initSuccessMac === macAddress) {
      return "bg-green-500 text-white hover:bg-green-600"; // Fully connected and initialized
    }
    if (failedMacAddress === macAddress) {
      return "bg-red-500 text-white hover:bg-red-600"; // Connection/initialization failed
    }
    return "bg-oves-blue text-white hover:bg-blue-600"; // Default state
  };

  const getButtonText = (macAddress) => {
    if (activeMacAddress === macAddress) {
      return (
        <span className="flex items-center">
          <AiOutlineLoading3Quarters className="animate-spin mr-2" />
          Connecting...
        </span>
      );
    }
    if (connectionSuccessMac === macAddress && !initSuccessMac) {
      return "Initializing...";
    }
    if (initSuccessMac === macAddress) {
      return (
        <span className="flex items-center">
          <span className="mr-2">✓</span>
          Connected
        </span>
      );
    }
    if (failedMacAddress === macAddress) {
      return "Retry Connection";
    }
    return "Connect";
  };

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
                    <button
                      onClick={(e) =>
                        handleConnectAndInitClick(e, device.macAddress)
                      }
                      className={`px-4 py-2 border rounded-md ml-4 ${
                        activeMacAddress === device.macAddress
                          ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                          : successMac === device.macAddress
                          ? "bg-green-500 text-white"
                          : failedMacAddress === device.macAddress
                          ? "bg-red-500 text-white"
                          : "bg-oves-blue text-white"
                      }`}
                      disabled={
                        loading || activeMacAddress === device.macAddress
                      }
                    >
                      {activeMacAddress === device.macAddress
                        ? "Connecting..."
                        : successMac === device.macAddress
                        ? "Connected"
                        : failedMacAddress === device.macAddress
                        ? "Failed to Connect"
                        : "Connect"}
                    </button>
                  </li>

                  {/* <div className="flex justify-between mt-2">
                    <button
                      onClick={(e) => handleConnectClick(e, device.macAddress)}
                      className={`w-full px-4 py-2 border rounded-md ${
                        connectingMacAddress === device.macAddress
                          ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                          : connectionSuccessMac === device.macAddress
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                      disabled={
                        loading || connectingMacAddress === device.macAddress
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
                      className={`w-full px-4 py-2 border rounded-md ${
                        initializingMacAddress === device.macAddress
                          ? "bg-gray-500 text-white cursor-not-allowed animate-pulse"
                          : initSuccessMac === device.macAddress
                          ? "bg-green-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                      disabled={
                        loading || initializingMacAddress === device.macAddress
                      }
                    >
                      {initializingMacAddress === device.macAddress
                        ? "Initializing..."
                        : initSuccessMac === device.macAddress
                        ? "Initialized"
                        : "Init BLE Data"}
                    </button>
                  </div> */}
                </React.Fragment>
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
