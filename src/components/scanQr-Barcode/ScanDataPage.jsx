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
  const [loading, setLoading] = useState(false);
  const requestCode = 999;
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(null);
  const navigate = useNavigate();
  const [activeMacAddress, setActivemacAddress] = useState(null);

  const handleMatchResult = (found) => {
    setMatchFound(found);
    setPopupVisible(true);
  };

  const handleContinue = () => {
    if (matchFound && state.initBleData) {
      navigate("/device-data", { state: { deviceData: state.initBleData.dataList } });
    }
    setPopupVisible(false);
  };

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

  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            const scannedValue = parsedData.respData?.value;
            const callbackRequestCode = parsedData.respData?.requestCode;

            if (callbackRequestCode === requestCode) {
              console.log("Scanned data received:", scannedValue);
              handleScanData(scannedValue);
            } else {
              console.error(
                "Request code mismatch. Expected:",
                requestCode,
                "Received:",
                callbackRequestCode
              );
            }
          } catch (error) {
            console.error("Error processing scan callback data:", error.message);
          }
        }
      );
    }
  }, []);

  const handleScanData = (scannedValue) => {
    if (scannedValue) {
      console.log("Scanned Value:", scannedValue);
      dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });
      initiateDeviceQueue();
    } else {
      console.error("Invalid scan data received.");
      alert("Invalid scan data. Neither a barcode nor a QR code.");
    }
  };

  const initiateDeviceQueue = () => {
    const detectedDevices = state.detectedDevices;
    if (detectedDevices && detectedDevices.length > 0) {
      const topDevices = detectedDevices
        .sort((a, b) => b.rssi - a.rssi)
        .slice(0, 5);
      setDeviceQueue(topDevices.map((device) => device.macAddress));
      connectToNextDevice();
    } else {
      console.warn("No BLE devices detected.");
    }
  };

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
            setDeviceQueue((prevQueue) => prevQueue.slice(1));
            connectToNextDevice();
          }
        }
      );
    }
  };

  const handleConnectAndInit = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Setting loading to true...");
    setLoading(true);
    setConnectingMacAddress(macAddress);

    try {
      await connectToBluetoothDevice(macAddress);
      console.log("Connected to Bluetooth device", macAddress);

      setTimeout(async () => {
        console.log("Starting BLE data initialization after delay");
        const response = await initBleData(macAddress);
        dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });
        console.log("Initialized BLE data:", response);

        setTimeout(() => {
          setConnectionSuccessMac(macAddress);
          setInitSuccessMac(macAddress);
          searchForMatch();
        }, 4000);

        setTimeout(() => {
          setConnectionSuccessMac(null);
          setInitSuccessMac(null);
        }, 10000);
      }, 3000);
    } catch (error) {
      console.error(
        "Error during Bluetooth connection or BLE data initialization:",
        error
      );
      alert("Failed to connect and initialize BLE data. Please try again.");
    } finally {
      console.log("Setting loading to false...");
      setLoading(false);
      setConnectingMacAddress(null);
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
                resolve(true);
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
              resolve(parsedData);
            } catch (error) {
              console.error("Error parsing JSON data from 'initBleData' response:", error);
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
          console.log("Match:", characteristic);
          break;
        }
      }
      if (match) break;
    }

    handleMatchResult(match, foundDeviceData);
  };

  useEffect(() => {
    if (state.initBleData && state.scannedData && isPopupVisible) {
      searchForMatch();
    }
  }, [state.initBleData, state.scannedData]);

  return (
    <div className="scan-data-page flex flex-col h-screen">
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-left">Scanned Data</h2>
        {state.scannedData && (
          <p className="text-left mt-2">Barcode Number: {state.scannedData}</p>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-left">Detected BLE Devices:</h3>
          {uniqueDevice.length > 0 ? (
            <ul className="text-left">
              {uniqueDevice.map((device) => (
                <li key={device.macAddress} className="mt-2 p-2 border rounded-md shadow flex items-center justify-between">
                  <div>
                    <p className="text-gray-700">Device Name: {device.name || "Unknown Device"}</p>
                    <p className="text-gray-700">Mac-Address: {device.macAddress}</p>
                    <p className="text-gray-700">Signal Strength: {device.rssi}db</p>
                  </div>
                  <button
                    onClick={(e) => handleConnectAndInit(e, device.macAddress)}
                    className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 ${
                      loading
                        ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                        : "bg-cyan-600 text-white hover:bg-cyan-700"
                    }`}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Connect"}
                  </button>
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
