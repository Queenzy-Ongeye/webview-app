import React, { useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { IoQrCodeOutline } from "react-icons/io5";


// Main component for handling BLE and QR code scanning
const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  // Assume ATT_SERVICE_ENUM is part of your state or you fetch it during component mount
  const ATT_SERVICE_ENUM = state.attServiceEnum || []; // Loaded ATT_SERVICE_ENUM data

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

  // Start QR code or barcode scanning
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        999, // Arbitrary request code
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData.data);
            if (!parsedData || !parsedData.respData || !parsedData.respData.value) {
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

  // Handle the scanned data and match it with the opid in ATT_SERVICE_ENUM
  const handleScanData = (barcode) => {
    console.log("Scanned data received:", barcode);
  
    // 1. Filter the nearby BLE devices based on the scanned barcode/device ID
    const matchingDevice = findMatchingDeviceByBarcode(barcode);
  
    if (matchingDevice) {
      console.log("Matching BLE device found:", matchingDevice);
      
      // 2. Connect to the device (if needed) or perform other business logic
      connectToDevice(matchingDevice);
  
      // 3. Fetch additional information or perform any business logic
      fetchAdditionalDeviceInfo(matchingDevice);
  
    } else {
      console.warn("No matching BLE device found for the scanned barcode.");
    }
  };
  
  // Function to match the scanned barcode/device ID with a BLE device
  const findMatchingDeviceByBarcode = (barcode) => {
    const detectedDevices = state.detectedDevices;
    // Find a BLE device that matches the barcode (could be by name, MAC, or opid)
    return detectedDevices.find(device => device.opid === barcode || device.name === barcode);
  };
  
  // Function to connect to the device (if needed)
  const connectToDevice = (device) => {
    // Use WebViewJavascriptBridge or Bluetooth API to connect
    window.WebViewJavascriptBridge.callHandler(
      "connBleByMacAddress", 
      device.macAddress, 
      (responseData) => {
        console.log("Connected to BLE device:", responseData);
      }
    );
  };
  
  // Function to fetch additional device information
  const fetchAdditionalDeviceInfo = (device) => {
    // Use the matched device's data to fetch more info or take actions
    console.log("Fetching additional info for device:", device);
    // Business logic to retrieve device info from a database, API, etc.
  };  

  return (
    <div className="scan-data-page">
      <div className="mt-10">
        <h2 className="text-2xl font-semibold">Scanned Data</h2>
        {state.scannedData && <p>Scanned Data: {state.scannedData}</p>}

        {/* Display matched opid information */}
        {state.matchingOpid ? (
          <div>
            <h3>Matching opid found:</h3>
            <p>{state.matchingOpid.opid}</p>
            <p>{state.matchingOpid.deviceName}</p> {/* Or other info from ATT_SERVICE_ENUM */}
          </div>
        ) : (
          <p>No matching opid found.</p>
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
        <IoQrCodeOutline className="text-2xl text-whie"/>
        <i className="fas fa-camera text-2xl"></i>
      </button>
    </div>
  );
};

export default ScanDataPage;
