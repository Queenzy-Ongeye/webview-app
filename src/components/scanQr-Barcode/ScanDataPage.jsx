import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PopupNotification from "../notification/PopUp";
import { useNavigate } from "react-router-dom";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [loading, setLoading] = useState(false);
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
      });
    }
    setPopupVisible(false); // Close the popup
  };

  // Function to initiate the BLE scan
  const startBleScan = () => {
    setLoading(true);
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
              // Sort devices by signal strength and queue the top 5
              const topDevices = parsedData.devices
                .sort((a, b) => b.rssi - a.rssi)
                .slice(0, 5);
              setDeviceQueue(topDevices.map((device) => device.macAddress));
              connectToNextDevice(); // Start the connection process
            }
          } catch (error) {
            console.error("Error parsing BLE scan data:", error.message);
          } finally {
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
      alert("No matching device found. Please try scanning again.");
      return;
    }

    const nextDeviceMac = deviceQueue[0];
    setLoading(true); // Show loading indicator during connection
    connectToBluetoothDevice(nextDeviceMac)
      .then(() => {
        console.log("Connected to device:", nextDeviceMac);
        return initBleData(nextDeviceMac);
      })
      .then((response) => {
        dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });
        searchForMatch(); // Automatically search for the match
      })
      .catch((error) => {
        console.error("Error during BLE connection or initialization:", error);
        alert("Connection failed. Trying next device...");
        setDeviceQueue((prevQueue) => prevQueue.slice(1)); // Remove the failed device and retry
        connectToNextDevice();
      })
      .finally(() => setLoading(false));
  };

  const connectToBluetoothDevice = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "connBleByMacAddress",
          macAddress,
          (responseData) => {
            const parsedData = JSON.parse(responseData);
            if (parsedData.respCode === "200") {
              resolve(true);
            } else {
              reject("Connection failed");
            }
          }
        );
      } else {
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
            const parsedData = JSON.parse(responseData);
            dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
            resolve(parsedData);
          }
        );
      } else {
        reject("WebViewJavascriptBridge not initialized");
      }
    });
  };

  // Search for a match in the BLE data
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
          break;
        }
      }
      if (match) break;
    }

    handleMatchResult(match, foundDeviceData);
  };

  // Automatically start the BLE scan and connection process on component mount
  useEffect(() => {
    startBleScan();
  }, []);

  return (
    <div className="scan-data-page flex flex-col h-screen">
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-left">
          Scanning for BLE Devices...
        </h2>
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
