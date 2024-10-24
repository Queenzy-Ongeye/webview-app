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

    // Store the scanned data in the state
    dispatch({ type: "SET_SCANNED_DATA", payload: barcode });

    // Find the opid that matches the barcode in ATT_SERVICE_ENUM
    const matchingOpid = findMatchingOpidInServiceEnum(barcode);

    if (matchingOpid) {
      console.log("Matching opid found:", matchingOpid);
      dispatch({ type: "SET_MATCHING_OPID", payload: matchingOpid });
      // You can now handle the matching opid (e.g., connect to a BLE device or perform other logic)
    } else {
      console.warn("No matching opid found for the scanned barcode.");
    }
  };

  // Find the opid that matches the scanned barcode in ATT_SERVICE_ENUM
  const findMatchingOpidInServiceEnum = (barcode) => {
    return ATT_SERVICE_ENUM.find((service) => service.opid === barcode);
  };

  // Connect to the BLE device (if needed) using its MAC address (optional depending on your use case)
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
