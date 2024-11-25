import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [loadingMap, setLoadingMap] = useState(new Map());
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const requestCode = 999;
  const navigate = useNavigate();

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
              setPopupMessage("Failed to start scan. Please try again.");
              setShowPopup(true);
            }
          }
        );
      } catch (error) {
        console.error("Error starting QR code scan:", error.message);
        setPopupMessage("Error starting scan. Please try again.");
        setShowPopup(true);
      }
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
      setPopupMessage("Scan functionality not available. Please try again later.");
      setShowPopup(true);
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
            console.error(
              "Error processing scan callback data:",
              error.message
            );
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
      setPopupMessage("Invalid scan data. Neither a barcode nor a QR code.");
      setShowPopup(true);
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
      scanBleDevices();
    }
  };

  const connectToNextDevice = () => {
    if (deviceQueue.length === 0) {
      setPopupMessage("No matching device found. Please scan again.");
      setShowPopup(true);
      return;
    }

    const nextDeviceMac = deviceQueue[0];
    setConnectingMacAddress(nextDeviceMac);
    setLoadingMap((prevMap) => new Map(prevMap.set(nextDeviceMac, true)));

    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        nextDeviceMac,
        (responseData) => {
          const parsedData = JSON.parse(responseData);
          if (parsedData.respCode === 200) {
            initBleData(nextDeviceMac);
          } else {
            console.log("Connection failed. Trying next device...");
            moveToNextDevice();
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
      moveToNextDevice();
    }
  };

  const initBleData = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
            console.log("BLE Init Data:", parsedData);
            searchForMatch(parsedData);
          } catch (error) {
            console.error(
              "Error parsing JSON data from 'initBleData' response:",
              error
            );
            moveToNextDevice();
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
      moveToNextDevice();
    }
  };

  const searchForMatch = (initBleData) => {
    const { scannedData } = state;

    if (!initBleData || !scannedData) {
      moveToNextDevice();
      return;
    }

    let match = false;
    for (const item of initBleData.dataList || []) {
      for (const characteristic of Object.values(item.characterMap || {})) {
        const { realVal, desc } = characteristic;
        if (
          (realVal && realVal.toString().includes(scannedData)) ||
          (desc && desc.includes(scannedData))
        ) {
          match = true;
          console.log("Match found:", characteristic);
          navigate("/ble-data", { state: { deviceData: initBleData.dataList } });
          return;
        }
      }
    }

    if (!match) {
      moveToNextDevice();
    }
  };

  const moveToNextDevice = () => {
    setDeviceQueue((prevQueue) => {
      const newQueue = prevQueue.slice(1);
      setLoadingMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.delete(connectingMacAddress);
        return newMap;
      });
      setConnectingMacAddress(null);
      
      if (newQueue.length > 0) {
        connectToNextDevice();
      } else {
        setPopupMessage("No matching device found after checking all devices.");
        setShowPopup(true);
      }
      
      return newQueue;
    });
  };

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
              initiateDeviceQueue();
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

  const uniqueDevicesMap = new Map();
  state.detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  const uniqueDevices = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  useEffect(() => {
    if (state.scannedData && (!state.detectedDevices || state.detectedDevices.length === 0)) {
      scanBleDevices();
    }
  }, [state.scannedData, state.detectedDevices]);

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
      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Scanning for devices...</p>
          </div>
        </div>
      )}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <p className="text-gray-700 mb-4">{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanDataPage;
