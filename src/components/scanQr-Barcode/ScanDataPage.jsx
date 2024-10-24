import React, { useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { IoQrCodeOutline } from "react-icons/io5";


// Main component
const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  // Check BLE devices once component is mounted
  useEffect(() => {
    if (!state.detectedDevices || state.detectedDevices.length === 0) {
      console.warn("No BLE devices detected. Please initiate BLE scan.");
    }
  }, [state.detectedDevices]);

  // Initiate QR code or barcode scanning
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        999, // Arbitrary request code
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData.data);
            if (
              !parsedData ||
              !parsedData.respData ||
              !parsedData.respData.value
            ) {
              throw new Error("No valid scan data received");
            }
            const scannedValue = parsedData.respData.value;
            console.log("Scanned Value:", scannedValue);
            handleScanData(scannedValue); // Process the scanned data
          } catch (error) {
            console.error("Error during QR/Barcode scan:", error.message);
          }
        }
      );
      dispatch({ type: "SET_QR_SCANNING", payload: true });
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  // Function to handle scanned data and find the matching BLE device
  const handleScanData = (data) => {
    console.log("Scanned data received:", data);

    const deviceId = extractDeviceIdFromScan(data); // Extract the device ID from the scanned data
    if (deviceId) {
      dispatch({ type: "SET_SCANNED_DATA", payload: deviceId });
      const matchingDevice = findMatchingDevice(deviceId);
      if (matchingDevice) {
        console.log("Matching BLE device found:", matchingDevice);
        dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
        connectToDevice(matchingDevice); // Use BLE API to connect to the device
      } else {
        console.warn("No matching BLE device found for the scanned data.");
      }
    } else {
      console.error("Invalid scan data. Unable to extract device ID.");
    }
  };

  const extractDeviceIdFromScan = (scannedData) => scannedData.trim(); // Trim and extract the device ID

  const findMatchingDevice = (deviceId) => {
    const detectedDevices = state.detectedDevices;
    if (!detectedDevices || detectedDevices.length === 0) {
      console.warn("No BLE devices detected.");
      return null;
    }
    const last6Digits = deviceId.slice(-6);
    return detectedDevices.find(
      (device) => device.name && device.name.slice(-6) === last6Digits
    );
  };

  const connectToDevice = (device) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        device.macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData.respCode === "200") {
              console.log(
                "Connected to the BLE device successfully:",
                parsedData
              );
              dispatch({
                type: "SET_BLE_CONNECTION_STATUS",
                payload: "connected",
              });
            } else {
              console.error(
                "Failed to connect to the BLE device:",
                parsedData.respDesc
              );
            }
          } catch (error) {
            console.error(
              "Error parsing BLE connection response:",
              error.message
            );
          }
        }
      );
    } else {
      console.error(
        "WebViewJavascriptBridge is not initialized for BLE connection."
      );
    }
  };

  return (
    <div className="scan-data-page">
      <div className="mt-14">
        <h2>Scanned Data</h2>
        {state.scannedData && <p>Scanned Data: {state.scannedData}</p>}
        {state.matchingDevice ? (
          <div>
            <h3>Matching BLE Device:</h3>
            <p>Name: {state.matchingDevice.name}</p>
            <p>MAC Address: {state.matchingDevice.macAddress}</p>
          </div>
        ) : (
          <p>No matching BLE device found.</p>
        )}
      </div>

      {/* Floating Button to Initiate QR Code Scan */}
      <button
        onClick={startQrCodeScan}
        className="fixed bottom-20 right-10 w-16 h-16 bg-oves-blue text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <IoQrCodeOutline className="text-2xl text-white" />
      </button>
    </div>
  );
};

export default ScanDataPage;
