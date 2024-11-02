import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [initializingMacAddress, setInitializingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({}); // Holds status messages for each device by macAddress
  const requestCode = 999;

  // Function to initiate the QR/barcode scan
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      try {
        window.WebViewJavascriptBridge.callHandler(
          "startQrCodeScan",
          requestCode,
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

            if (callbackRequestCode === requestCode) {
              console.log("Scanned data received:", scannedValue);
              handleScanData(scannedValue);
            } else {
              console.error("Request code mismatch.");
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
      const topDevices = detectedDevices.sort((a, b) => b.rssi - a.rssi).slice(0, 5);
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
          if (parsedData.respCode === "200") {
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

  const initBleData = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);

            if (parsedData && Array.isArray(parsedData.dataList)) {
              dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
              const matchingDevice = findMatchingDevice(parsedData);

              if (matchingDevice) {
                console.log("Matching BLE device found:", matchingDevice);
                dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
                setDeviceStatus((prevStatus) => ({
                  ...prevStatus,
                  [macAddress]: "Matching device found!",
                }));
              } else {
                setDeviceStatus((prevStatus) => ({
                  ...prevStatus,
                  [macAddress]: "No match found for the scanned barcode.",
                }));
              }

              setTimeout(() => {
                setDeviceStatus((prevStatus) => ({
                  ...prevStatus,
                  [macAddress]: null,
                }));
              }, 5000);
            } else {
              console.warn("Received data does not contain a valid dataList.");
              alert("Initialization data is incomplete. Please try again.");
            }
          } catch (error) {
            console.error("Error processing initBleData response:", error);
            alert("An error occurred while processing BLE data.");
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const findMatchingDevice = (deviceData) => {
    if (!Array.isArray(deviceData?.dataList)) {
      console.warn("findMatchingDevice: dataList is undefined or not an array.");
      return null;
    }

    return deviceData.dataList.find((device) =>
      device.services?.some((service) =>
        Object.values(service.characterMap || {}).some((characteristic) =>
          recursiveSearch(characteristic, state.scannedData)
        )
      )
    );
  };

  const recursiveSearch = (obj, searchValue) => {
    if (typeof obj === "string" || typeof obj === "number") {
      return obj.toString() === searchValue.toString();
    } else if (Array.isArray(obj)) {
      return obj.some((item) => recursiveSearch(item, searchValue));
    } else if (typeof obj === "object" && obj !== null) {
      return Object.values(obj).some((value) =>
        recursiveSearch(value, searchValue)
      );
    }
    return false;
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
          {state.detectedDevices && state.detectedDevices.length > 0 ? (
            <ul className="text-left">
              {state.detectedDevices.map((device) => (
                <React.Fragment key={device.macAddress}>
                  <li className="mt-2 p-2 border rounded-md shadow">
                    <p className="text-gray-700">
                      Device Name: {device.name || "Unknown Device"}
                    </p>
                    <p className="text-gray-700">Mac-Address: {device.macAddress}</p>
                    <p className="text-gray-700">Signal Strength: {device.rssi}db</p>
                  </li>
                  <div className="flex justify-between mt-2">
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
                      onClick={(e) => handleInitBleDataClick(e, device.macAddress)}
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
                  </div>
  
                  {/* Display connection or match status below each device */}
                  {deviceStatus[device.macAddress] && (
                    <p className="mt-1 text-sm text-center font-semibold">
                      {deviceStatus[device.macAddress]}
                    </p>
                  )}
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
    </div>
  );  
};

export default ScanDataPage;
