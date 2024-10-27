import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi"; // Refresh icon for retry
import Lottie from "lottie-react"; // Lottie for animations (assuming you have installed lottie-react)
import loadingAnimation from "../../assets/loading.json"; // Import a Lottie animation file

// Main component for handling BLE and QR code scanning
const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [isScanning, setIsScanning] = useState(false);

  // Function to start BLE scanning and store detected devices in the state
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
              // Store BLE devices in state with their metadata
              dispatch({
                type: "ADD_DETECTED_DEVICE",
                payload: parsedData.devices,
              });
            }
          } catch (error) {
            console.error("Error parsing BLE scan data:", error.message);
          } finally {
            setIsScanning(false); // Stop scanning indicator
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE scan.");
      setIsScanning(false);
    }
  };

  // Start QR code or barcode scanning (with requestCode)
  const startQrCodeScan = () => {
    const requestCode = 999;
    if (window.WebViewJavascriptBridge) {
      try {
        window.WebViewJavascriptBridge.callHandler(
          "startQrCodeScan",
          requestCode,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              if (parsedData.respCode === 200 && parsedData.respData === true) {
                console.log("QR/Barcode scan initiated successfully.");
              } else {
                console.error(
                  "Failed to start QR/Barcode scan:",
                  parsedData.respDesc
                );
              }
            } catch (error) {
              console.error("Error initiating QR/Barcode scan:", error.message);
            }
          }
        );
        dispatch({ type: "SET_QR_SCANNING", payload: true });
      } catch (error) {
        console.error(
          "Error invoking WebViewJavascriptBridge for QR/Barcode scan:",
          error.message
        );
      }
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
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
    <div className="scan-data-page flex flex-col h-screen">
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-left">Scanned Data</h2>
        {state.scannedData && (
          <p className="text-left mt-2">{state.scannedData}</p>
        )}

        {/* Display matched BLE device information */}
        {state.matchingDevice ? (
          <div className="mt-2 text-left">
            <h3 className="text-lg font-semibold">Matching BLE Device:</h3>
            <p className="text-gray-700">Name: {state.matchingDevice.name}</p>
            <p className="text-gray-700">
              MAC Address: {state.matchingDevice.macAddress}
            </p>
          </div>
        ) : (
          <div className="mt-6 text-left">
            <p className="text-gray-500">No matching BLE device found.</p>
          </div>
        )}

        {/* Display BLE connection status */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-left">
            BLE Connection Status:
          </h3>
          <p className="text-left text-gray-700">
            {state.bleConnectionStatus || "Not connected"}
          </p>
        </div>
      </div>

      {/* Show a loading animation and retry button if no devices detected */}
      {(!state.detectedDevices || state.detectedDevices.length === 0) && (
        <div className="mt-10 text-center">
          {isScanning ? (
            <>
              <Lottie
                animationData={loadingAnimation}
                loop={true}
                className="w-32 h-32 mx-auto"
              />
              <p className="text-lg text-gray-600 mt-4">
                Scanning for BLE devices...
              </p>
            </>
          ) : (
            <>
              <p className="text-lg text-gray-600">No BLE devices found.</p>
              <button
                onClick={scanBleDevices}
                className="mt-4 px-6 py-2 bg-oves-blue text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
              >
                <FiRefreshCw className="mr-2" />
                Retry Scan
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating Button to Initiate QR Code Scan */}
      <button
        onClick={startQrCodeScan}
        className="fixed bottom-20 right-3 w-16 h-16 bg-oves-blue rounded-full shadow-lg flex items-center justify-center"
      >
        <IoQrCodeOutline className="text-2xl text-white" />
      </button>
    </div>
  );
};

export default ScanDataPage;