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
  const requestCode = 999;
  const [deviceStatus, setDeviceStatus] = useState({}); // Holds status messages for each device by macAddress

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
          if (parsedData.respCode === "200") {
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

  const handleConnectClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setConnectingMacAddress(macAddress);
    setLoading(true); // Start loading indicator for the connection process

    try {
      // Attempt to connect to the Bluetooth device
      await connectToBluetoothDevice(macAddress);
      console.log("Connected to Bluetooth device", macAddress);

      // If the connection is successful, set the success state for the current MAC
      setTimeout(() => {
        setConnectionSuccessMac(macAddress);
        setTimeout(() => setConnectionSuccessMac(null), 10000); // Clear success state after 10 seconds
      }, 23000);
    } catch (error) {
      // If the connection fails, log the error and show an alert
      console.error("Error connecting to Bluetooth device:", error);
      alert("Failed to connect to Bluetooth device. Please try again.");

      // Ensure that the success state is not set in case of failure
      setConnectionSuccessMac(null); // Clear any success indicator
    } finally {
      setTimeout(() => {
        setConnectingMacAddress(null);
        setLoading(false);
      }, 23000);
    }
  };

  const handleInitBleDataClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setInitializingMacAddress(macAddress);
    setLoading(true);

    try {
      const response = await initBleData(macAddress);
      console.log("Response from initBleData:", response);
      const parsedData = JSON.parse(response);
      dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: parsedData });

      if (parsedData) {
        // Attempt to find a matching device
        const matchingDevice = findMatchingDevice(parsedData);
        if (matchingDevice) {
          dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
          console.log("Matching BLE device found:", matchingDevice);

          // Update UI status to show matching result
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

        // Clear the status message after a few seconds
        setTimeout(() => {
          setDeviceStatus((prevStatus) => ({
            ...prevStatus,
            [macAddress]: null,
          }));
        }, 15000); // Clears message after 15 seconds
      } else {
        console.warn("Initialization data is incomplete or missing.");
        alert("Initialization data is missing. Please try again.");
      }
      // Set success state for the current MAC
      setTimeout(() => {
        setInitSuccessMac(macAddress);
        setTimeout(() => setInitSuccessMac(null), 10000);
      }, 38000);
    } catch (error) {
      console.error("Error during BLE Data Initialization:", error.message);
      alert("Failed to initialize BLE data. Please try again.");
    } finally {
      setTimeout(() => {
        setInitializingMacAddress(null);
        setLoading(false);
      }, 20000);
    }
  };

  const connectToBluetoothDevice = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData.respCode === "200") {
              initBleData(macAddress);
            }
            dispatch({ type: "SET_BLE_DATA", payload: parsedData });
            console.log("BLE Device Data:", parsedData);
          } catch (error) {
            console.error(
              "Error parsing JSON data from 'connBleByMacAddress' response:",
              error
            );
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  // Enhanced logging for findMatchingDevice
  const findMatchingDevice = (deviceData) => {
    // Iterate over each device in dataList to find a match
    return deviceData.dataList.find((device) =>
      device.services?.some((service) =>
        Object.values(service.characterMap || {}).some((characteristic) =>
          characteristicContainsScannedData(characteristic, state.scannedData)
        )
      )
    );
  };

  // Helper function to check if a characteristic contains the scanned barcode data
  const characteristicContainsScannedData = (characteristic, scannedData) => {
    // List the specific properties where you expect to find the scanned data
    const propertiesToCheck = ["realVal", "desc"];

    return propertiesToCheck.some((property) =>
      characteristic[property]?.toString().includes(scannedData.toString())
    );
  };

  // UI handling for matching status
  const initBleData = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData) {
              dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
              const matchingDevice = findMatchingDevice(parsedData);

              if (matchingDevice) {
                console.log("Matching BLE device found:", matchingDevice);
                dispatch({
                  type: "SET_MATCHING_DEVICE",
                  payload: matchingDevice,
                });
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

              // Clear the status message after a few seconds
              setTimeout(() => {
                setDeviceStatus((prevStatus) => ({
                  ...prevStatus,
                  [macAddress]: null,
                }));
              }, 5000); // Clears message after 5 seconds
            } else {
              console.warn("Received data does not contain a valid dataList.");
              alert("Initialization data is incomplete. Please try again.");
            }
          } catch (error) {
            console.error(
              "Error processing initBleData response:",
              error.message
            );
            alert("An error occurred while processing BLE data.");
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
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
          {state.detectedDevices && state.detectedDevices.length > 0 ? (
            <ul className="text-left">
              {Array.from(
                new Map(
                  state.detectedDevices.map((device) => [
                    device.macAddress,
                    device,
                  ])
                ).values()
              ).map((device, index) => (
                <React.Fragment key={device.macAddress}>
                  <li className="mt-2 p-2 border rounded-md shadow">
                    <p className="text-gray-700">
                      Device Name: {device.name || "Unknown Device"}
                    </p>
                    <p className="text-gray-700">
                      Mac-Address: {device.macAddress}
                    </p>
                    <p className="text-gray-700">
                      Signal Strength: {device.rssi}db
                    </p>
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
