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
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null);
  const [loadingMap, setLoadingMap] = useState(new Map()); // Track loading per device
  const requestCode = 999;
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(null);
  const navigate = useNavigate();

  const handleMatchResult = (found) => {
    setMatchFound(found);
    setPopupVisible(true);
  };

  // Function to handle "View Device Data" button click when match is found
  const handleContinue = () => {
    if (matchFound && state.initBleData) {
      navigate("/device-data", {
        state: { deviceData: state.initBleData.dataList },
      }); // Pass data to new page
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

  // Initiate device pairing process
  const handleConnectAndInit = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

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
        setTimeout(() => {
          setConnectionSuccessMac(macAddress);
          setInitSuccessMac(macAddress);
          searchForMatch();
        }, 40000);

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
      }, 50000);
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
          foundDeviceData = item; // Store matched device data
          console.log("Match:", characteristic);
          break;
        }
      }
      if (match) break;
    }

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

  // Helper function to check if any device is loading
  const isAnyDeviceLoading = () => {
    return Array.from(loadingMap.values()).some((isLoading) => isLoading);
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
            <ul className="text-left">
              {uniqueDevice.map((device, index) => (
                <React.Fragment key={device.macAddress}>
                  <li className="mt-2 p-2 border rounded-md shadow flex items-center justify-between">
                    <div>
                      <p className="text-gray-700">
                        Device Name: {device.name || "Unknown Device"}
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

        <button
          onClick={startQrCodeScan}
          className="fixed bottom-20 right-3 w-16 h-16 bg-oves-blue rounded-full shadow-lg flex items-center justify-center"
        >
          <IoQrCodeOutline className="text-2xl text-white" />
        </button>
      </div>
      {isAnyDeviceLoading() && (
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
