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
      scanBleDevices(); // Start BLE device scan and connection process
    } else {
      console.error("Invalid scan data received.");
      alert("Invalid scan data. Neither a barcode nor a QR code.");
    }
  };

  // Scan BLE devices
  const scanBleDevices = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        null,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData && parsedData.devices) {
              const topDevices = parsedData.devices
                .sort((a, b) => b.rssi - a.rssi)
                .slice(0, 5);
              setDeviceQueue(topDevices.map((device) => device.macAddress)); // Queue the top devices
              connectToNextDevice(); // Start connecting to devices
            }
          } catch (error) {
            console.error("Error parsing BLE scan data:", error.message);
            setLoading(false);
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE scan.");
      setLoading(false);
    }
  };

  // Connect to the next device in the queue
  const connectToNextDevice = () => {
    if (deviceQueue.length === 0) {
      alert("No matching device found. Please scan again.");
      setLoading(false);
      return;
    }

    const nextDeviceMac = deviceQueue[0];
    connectToBluetoothDevice(nextDeviceMac)
      .then(() => initBleData(nextDeviceMac))
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
