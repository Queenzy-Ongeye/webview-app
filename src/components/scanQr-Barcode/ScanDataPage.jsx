import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import PopupNotification from "../notification/PopUp";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState(""); // Track progress message
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(null);
  const navigate = useNavigate();

  // Handle match result and show a popup
  const handleMatchResult = (found) => {
    setMatchFound(found);
    setPopupVisible(true);
  };

  // Handle continuing to the device data page when match is found
  const handleContinue = () => {
    if (matchFound && state.initBleData) {
      navigate("/device-data", {
        state: { deviceData: state.initBleData.dataList },
      });
    }
    setPopupVisible(false);
  };

  // Start QR/barcode scan
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      try {
        window.WebViewJavascriptBridge.callHandler(
          "startQrCodeScan",
          999,
          (responseData) => {
            const parsedResponse = JSON.parse(responseData);
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

  // Register callback handler for scan result
  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            const scannedValue = parsedData.respData?.value;
            handleScanData(scannedValue);
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

  // Handle scanned data and start BLE scanning and connection
  const handleScanData = (scannedValue) => {
    if (scannedValue) {
      console.log("Scanned Value:", scannedValue);
      dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });
      setLoading(true); // Start loading spinner
      setProgressMessage("Scanning for devices..."); // Show scanning message
      scanBleDevices(); // Start BLE device scan and connection process
    } else {
      console.error("Invalid scan data received.");
      alert("Invalid scan data. Neither a barcode nor a QR code.");
    }
  };

  // Scan BLE devices
  const scanBleDevices = () => {
    if (window.WebViewJavascriptBridge) {
      // Indicate that scanning has started
      dispatch({ type: "SET_IS_SCANNING", payload: true });

      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        "",
        (responseData) => {
          try {
            const jsonData = JSON.parse(responseData);

            if (jsonData && jsonData.devices && jsonData.devices.length > 0) {
              // Sort devices by RSSI (signal strength) in descending order
              const sortedDevices = jsonData.devices.sort(
                (a, b) => b.rssi - a.rssi
              );
              // Dispatch sorted devices
              dispatch({
                type: "SET_BLE_DATA",
                payload: { ...jsonData, devices: sortedDevices },
              });
              console.log("Sorted BLE Data:", sortedDevices);
              setDeviceQueue(sortedDevices.map((device) => device.macAddress)); // Queue the top devices
              setProgressMessage("Connecting to devices..."); // Show connecting message
              connectToNextDevice(); // Start connecting to devices
            } else {
              // No devices found
              console.warn("No BLE devices found.");
              dispatch({
                type: "SET_SCAN_ERROR",
                payload: "No BLE devices found.",
              });
            }
          } catch (error) {
            console.error(
              "Error parsing JSON data from 'startBleScan' response:",
              error
            );
          } finally {
            // Set scanning state to false regardless of success or failure
            dispatch({ type: "SET_IS_SCANNING", payload: false });
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
      dispatch({ type: "SET_IS_SCANNING", payload: false });
    }
  };

  // Connect to the next device in the queue
  const connectToNextDevice = () => {
    if (deviceQueue.length === 0) {
      alert("No matching device found. Please scan again.");
      setLoading(false);
      setProgressMessage(""); // Clear message when no device found
      return;
    }

    const nextDeviceMac = deviceQueue[0];
    setProgressMessage(`Connecting to device: ${nextDeviceMac}...`); // Show connecting to specific device
    connectToBluetoothDevice(nextDeviceMac)
      .then(() => {
        setProgressMessage("Initializing device data..."); // Show initializing message
        return initBleData(nextDeviceMac);
      })
      .then((response) => {
        dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });
        searchForMatch();
      })
      .catch(() => {
        setDeviceQueue((prevQueue) => prevQueue.slice(1)); // Remove the failed device and try next
        connectToNextDevice();
      });
  };

  // Connect to Bluetooth device
  const connectToBluetoothDevice = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "connBleByMacAddress",
          macAddress,
          (responseData) => {
            const parsedData = JSON.parse(responseData);
            parsedData.respCode === "200"
              ? resolve()
              : reject("Connection failed");
          }
        );
      } else {
        reject("WebViewJavascriptBridge not initialized");
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
              resolve(parsedData); // Resolve with the retrieved data
            } catch (error) {
              reject("Error parsing BLE data initialization response");
            }
          }
        );
      } else {
        reject("WebViewJavascriptBridge not initialized");
      }
    });
  };

  // Search for a match in the initialized BLE data
  const searchForMatch = () => {
    const { initBleData, scannedData } = state;

    if (!initBleData || !scannedData) {
      handleMatchResult(false);
      setLoading(false);
      setProgressMessage(""); // Clear message when search is done
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
    setLoading(false);
    setProgressMessage(""); // Clear message when match is found or not found
  };

  return (
    <div className="scan-data-page flex flex-col h-screen">
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-left">Scanned Data</h2>
        {state.scannedData && (
          <p className="text-left mt-2">Barcode Number: {state.scannedData}</p>
        )}
        <button
          onClick={startQrCodeScan}
          className="fixed bottom-20 right-3 w-16 h-16 bg-oves-blue rounded-full shadow-lg flex items-center justify-center"
        >
          <IoQrCodeOutline className="text-2xl text-white" />
        </button>
      </div>

      {loading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50">
          <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white mb-4" />
          <h2 className="text-white">{progressMessage}</h2>
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
