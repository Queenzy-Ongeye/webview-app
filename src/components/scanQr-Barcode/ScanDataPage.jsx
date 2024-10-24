import React, { useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { IoQrCodeOutline } from "react-icons/io5";

// Main component for handling BLE and QR code scanning
const ScanDataPage = () => {
  const { state, dispatch } = useStore();

  // Function to start BLE scanning and store detected devices in the state
  const scanBleDevices = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        null,
        (responseData) => {
          const parsedData = JSON.parse(responseData);
          if (parsedData && parsedData.devices) {
            dispatch({
              type: "ADD_DETECTED_DEVICE",
              payload: parsedData.devices,
            });
          }
        }
      );
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

  // Handle the scanned data and match it with a BLE device (no slicing, full barcode match)
  const handleScanData = (barcode) => {
    console.log("Scanned data received:", barcode);

    if (isBarcode(barcode)) {
      console.log("Data is a valid barcode");
      dispatch({ type: "SET_SCANNED_DATA", payload: barcode });

      // Find the BLE device that matches the barcode
      const matchingDevice = findMatchingDeviceByBarcode(barcode);

      if (matchingDevice) {
        console.log("Matching BLE device found:", matchingDevice);
        dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
        connectToDevice(matchingDevice); // Connect to the matching BLE device
      } else {
        console.warn("No matching BLE device found for the scanned barcode.");
      }
    } else if (isQrCode(barcode)) {
      console.log("Data is a valid QR code");
      dispatch({ type: "SET_SCANNED_DATA", payload: barcode });
    } else {
      console.error(
        "Invalid scan data. Neither a valid barcode nor a QR code."
      );
    }
  };

  // Find a BLE device that matches the scanned barcode (full match)
  const findMatchingDeviceByBarcode = (barcode) => {
    const detectedDevices = state.detectedDevices;

    if (!detectedDevices || detectedDevices.length === 0) {
      console.warn("No BLE devices detected.");
      return null;
    }

    // Find a BLE device whose name or MAC address exactly matches the scanned barcode
    return detectedDevices.find((device) => {
      return device.name === barcode || device.macAddress === barcode;
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
              dispatch({
                type: "SET_BLE_CONNECTION_STATUS",
                payload: "disconnected",
              });
            }
          } catch (error) {
            console.error(
              "Error parsing BLE connection response:",
              error.message
            );
            dispatch({
              type: "SET_BLE_CONNECTION_STATUS",
              payload: "disconnected",
            });
          }
        }
      );
    } else {
      console.error(
        "WebViewJavascriptBridge is not initialized for BLE connection."
      );
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
        <h2 className="text-2xl font-bold">Scanned Data</h2>
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
