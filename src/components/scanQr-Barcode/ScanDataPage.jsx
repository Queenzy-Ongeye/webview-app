import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import Notification from "../notification/Notification";
import PopupNotification from "../notification/PopUp";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const requestCode = 999;

  useEffect(() => {
    // Start QR code scanning on component mount
    startQrCodeScan();
  }, []);

  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        requestCode,
        (responseData) => {
          try {
            const parsedResponse = JSON.parse(responseData);
            if (parsedResponse.respCode === "200" && parsedResponse.respData) {
              handleScanData(parsedResponse.respData.value); // Process scanned barcode
            } else {
              console.error("Scan failed:", parsedResponse.respDesc);
            }
          } catch (error) {
            console.error("Error parsing scan response:", error.message);
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const handleScanData = (scannedValue) => {
    if (scannedValue) {
      dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });
      initiateDeviceQueue();
    } else {
      console.error("Invalid scan data received.");
    }
  };

  const initiateDeviceQueue = () => {
    const detectedDevices = state.detectedDevices;
    if (detectedDevices?.length > 0) {
      const topDevices = detectedDevices
        .sort((a, b) => b.rssi - a.rssi)
        .slice(0, 5);
      setDeviceQueue(topDevices.map((device) => device.macAddress));
      processNextDevice(); // Start processing devices
    } else {
      console.warn("No BLE devices detected.");
    }
  };

  const processNextDevice = async () => {
    if (deviceQueue.length === 0) {
      handleMatchResult(false); // Trigger popup if no match is found
      return;
    }

    const currentDevice = deviceQueue[0]; // Get the next device in the queue
    try {
      console.log(`Connecting to device: ${currentDevice}`);
      await connectToBluetoothDevice(currentDevice);
      console.log(`Initializing BLE data for device: ${currentDevice}`);
      const initResponse = await initBleData(currentDevice);

      dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: initResponse });
      const matchFound = searchForMatch(initResponse);

      if (matchFound) {
        handleMatchResult(true); // Match found, trigger popup
        return; // Stop processing further devices
      } else {
        console.log("No match found. Moving to the next device...");
        setDeviceQueue((prevQueue) => prevQueue.slice(1)); // Remove processed device
        processNextDevice(); // Process the next device
      }
    } catch (error) {
      console.error("Error processing device:", error.message);
      setDeviceQueue((prevQueue) => prevQueue.slice(1)); // Remove failed device
      processNextDevice(); // Continue with the next device
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
                resolve(true); // Successful connection
              } else {
                reject(new Error("Failed to connect to device."));
              }
            } catch (error) {
              console.error("Error parsing connection response:", error);
              reject(error);
            }
          }
        );
      } else {
        reject(new Error("WebViewJavascriptBridge is not initialized."));
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
              resolve(parsedData);
            } catch (error) {
              reject(new Error("Failed to initialize BLE data."));
            }
          }
        );
      } else {
        reject(new Error("WebViewJavascriptBridge is not initialized."));
      }
    });
  };

  const searchForMatch = (initBleData) => {
    const scannedData = state.scannedData;
    if (!initBleData || !scannedData) return false;

    for (const item of initBleData.dataList || []) {
      for (const characteristic of Object.values(item.characterMap || {})) {
        const { realVal, desc } = characteristic;
        if (
          (realVal && realVal.toString().includes(scannedData)) ||
          (desc && desc.includes(scannedData))
        ) {
          console.log("Match found:", characteristic);
          return true; // Match found
        }
      }
    }
    return false; // No match found
  };

  const handleMatchResult = (found) => {
    setMatchFound(found);
    setPopupVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
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

  return (
    <div className="scan-data-page flex flex-col h-screen">
      <h1 className="text-2xl font-bold text-center">
        Automated Device Matching
      </h1>
      <p className="text-center mt-4">
        {deviceQueue.length === 0 ? "Ready to scan." : "Processing devices..."}
      </p>
      {isPopupVisible && (
        <PopupNotification
          matchFound={matchFound}
          onClose={handleClosePopup}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
};

export default ScanDataPage;
