import React, { useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { IoQrCodeOutline } from "react-icons/io5";
import { toast, Bounce } from "react-toastify";

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
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE scan.");
    }
  };

  // Start QR code or barcode scanning (with requestCode)
  const startQrCodeScan = () => {
    const requestCode = 999; // Use requestCode as a string
    if (window.WebViewJavascriptBridge) {
      try {
        window.WebViewJavascriptBridge.callHandler(
          "startQrCodeScan",
          requestCode, // Pass the requestCode as a string
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              if (parsedData.respCode === 200 && parsedData.respData === true) {
                console.log("QR/Barcode scan initiated successfully.");
                // Now wait for the callback to receive the scanned data
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

  // Register the scanQrcodeResultCallBack for handling scanned data
  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack", // Handler name
        (data) => {
          const { respData } = JSON.parse(data);
          const scannedValue = respData?.value;

          if (respData?.requestCode === 999) {
            console.log("Scanned Value:", scannedValue);
            // Store the scanned data in the state
            dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });
            // Handle the scanned data: Match it with the realVal in DTA_SERVICE_NAME
            const matchingDevice = findMatchingDeviceByOpid(scannedValue);
            if (matchingDevice) {
              console.log("Matching BLE device found:", matchingDevice);
              dispatch({
                type: "SET_MATCHING_DEVICE",
                payload: matchingDevice,
              });
              // Additional logic to display or interact with the matched device
            } else {
              console.warn(
                "No matching BLE device found for the scanned barcode."
              );
            }
          }
        }
      );
    }
  }, [state.detectedDevices]);

  // Find a BLE device that matches the scanned barcode/QR code by checking the realVal of the DTA_SERVICE_NAME
  const findMatchingDeviceByOpid = (scannedBarcode) => {
    const detectedDevices = state.initBleDataResponse?.dataList;
    if (!detectedDevices) return null;
    console.log("device detected here:", detectedDevices);
    
    return detectedDevices.find((device) => {
      const dtaService = device.services.find(
        (service) => service.serviceNameEnum === "DTA_SERVICE_NAME"
      );
      return Object.keys(dtaService.characterMap).some((charUuid) => {
        const characteristic = dtaService.characterMap[charUuid];
        const normalizedRealVal = characteristic?.realVal
          ?.toString()
          .trim()
          .toLowerCase();
        return normalizedRealVal === scannedBarcode;
      });
    });
  };

  // UseEffect hook to start BLE scanning when the component is mounted
  useEffect(() => {
    if (!state.detectedDevices || state.detectedDevices.length === 0) {
      console.warn("No BLE devices detected. Starting BLE scan...");
      toast.error("No BLE devices detected. Starting BLE scan...", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
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
            {/* Add more device details as necessary */}
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
        className="fixed bottom-20 right-5 w-16 h-16 bg-oves-blue rounded-full shadow-lg flex items-center justify-center"
      >
        <IoQrCodeOutline className="text-2xl text-white" />
      </button>
    </div>
  );
};

export default ScanDataPage;
