import React, { useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { IoQrCodeOutline } from "react-icons/io5";


// Main component for handling BLE and QR code scanning
const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  // Function to start BLE scanning and store detected devices in the state
  const scanBleDevices = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler("startBleScan", null, (responseData) => {
        const parsedData = JSON.parse(responseData);
        if (parsedData && parsedData.devices) {
          dispatch({ type: "SET_DETECTED_DEVICES", payload: parsedData.devices });
        }
      });
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE scan.");
    }
  };

  // Start QR code or barcode scanning (with requestCode)
  const startQrCodeScan = () => {
    const requestCode = 999; // Assign a requestCode
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        requestCode, // Pass the requestCode
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData.respCode === "200" && parsedData.respData === true) {
              console.log("QR/Barcode scan initiated successfully.");
              // Now wait for the callback to receive the scanned data
            } else {
              console.error("Failed to start QR/Barcode scan:", parsedData.respDesc);
            }
          } catch (error) {
            console.error("Error initiating QR/Barcode scan:", error.message);
          }
        }
      );
      dispatch({ type: "SET_QR_SCANNING", payload: true });
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  // Register the scanQrcodeResultCallBack
  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      // Register the scanQrcodeResultCallBack function with WebViewJavascriptBridge
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack", // Handler name (as provided in the documentation)
        (data) => {
          // This function will be called when the scan completes
          console.log("QR/Barcode scan callback received:", data);

          // The result contains the scanned value and requestCode
          const scannedValue = data.value;
          const requestCode = data.requestCode;

          // Check if the requestCode matches
          if (requestCode === "999") {
            console.log("Scanned Value:", scannedValue);
            // Store the scanned data in the state
            dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });
            // Handle the scanned data (whether it's a barcode or QR code)
            const matchingDevice = findMatchingDeviceByScannedData(scannedValue);

            if (matchingDevice) {
              console.log("Matching BLE device found:", matchingDevice);
              dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
              connectToDevice(matchingDevice); // Connect to the matching BLE device
            } else {
              console.warn("No matching BLE device found for the scanned data.");
            }
          } else {
            console.error("Request code mismatch. Expected 999 but got:", requestCode);
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for callback registration.");
    }
  }, []);

  // Find a BLE device that matches the scanned data (whether it's a barcode or QR code)
  const findMatchingDeviceByScannedData = (scannedData) => {
    const detectedDevices = state.detectedDevices;

    if (!detectedDevices || detectedDevices.length === 0) {
      console.warn("No BLE devices detected.");
      return null;
    }

    // Find a BLE device whose name or MAC address matches the scanned data
    return detectedDevices.find((device) => {
      return device.name === scannedData || device.macAddress === scannedData;
    });
  };

  // Connect to the BLE device using its MAC address
  const connectToDevice = (device) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress", // BLE connection handler
        device.macAddress, // Pass the MAC address of the BLE device
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData.respCode === "200") {
              console.log("Connected to the BLE device successfully:", parsedData);
              dispatch({ type: "SET_BLE_CONNECTION_STATUS", payload: "connected" });
            } else {
              console.error("Failed to connect to the BLE device:", parsedData.respDesc);
              dispatch({ type: "SET_BLE_CONNECTION_STATUS", payload: "disconnected" });
            }
          } catch (error) {
            console.error("Error parsing BLE connection response:", error.message);
            dispatch({ type: "SET_BLE_CONNECTION_STATUS", payload: "disconnected" });
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE connection.");
    }
  };

  // UseEffect hook to start BLE scanning when the component is mounted
  useEffect(() => {
    if (!state.detectedDevices || state.detectedDevices.length === 0) {
      console.warn("No BLE devices detected. Starting BLE scan...");
      scanBleDevices(); // Start scanning BLE devices
    }
  }, [state.detectedDevices]);

  return (
    <div className="scan-data-page">
      <div className="mt-14">
        <h2>Scanned Data</h2>
        {state.scannedData && <p>Scanned Data: {state.scannedData}</p>}

        {/* Display matched BLE device information */}
        {state.matchingDevice ? (
          <div>
            <h3>Matching BLE Device:</h3>
            <p>Name: {state.matchingDevice.name}</p>
            <p>MAC Address: {state.matchingDevice.macAddress}</p>
          </div>
        ) : (
          <p>No matching BLE device found.</p>
        )}

        {/* Display BLE connection status */}
        <div>
          <h3>BLE Connection Status: {state.bleConnectionStatus}</h3>
        </div>
      </div>

      {/* Floating Button to Initiate QR Code Scan */}
      <button
        onClick={startQrCodeScan}
        className="fixed bottom-20 right-4 w-16 h-16 bg-oves-blue text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <IoQrCodeOutline className="text-2xl text-white" />
      </button>
    </div>
  );
};

export default ScanDataPage;
