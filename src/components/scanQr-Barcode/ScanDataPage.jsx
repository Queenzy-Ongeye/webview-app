import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loading.json";
import stringSimilarity from "string-similarity";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [isScanning, setIsScanning] = useState(false);

  // Partial matching: checks if the first few characters are similar
  const partialMatch = (val1, val2) => {
    // Check if the first 4 characters match
    return val1.slice(0, 4) === val2.slice(0, 4);
  };

  // Fuzzy matching with a similarity threshold
  const fuzzyMatch = (val1, val2, threshold = 0.6) => {
    const similarity = stringSimilarity.compareTwoStrings(val1, val2);
    return similarity >= threshold;
  };

  // Function to find a BLE device that matches the scanned barcode/QR code
  const findMatchingDeviceByOpid = (scannedData) => {
    const detectedDevices = state.initBleDataResponse?.dataList;
    if (!detectedDevices) return null;

    // Step 1: Try exact matching
    let matchingDevice = detectedDevices.find((device) => {
      const dtaService = device.services.find(
        (service) => service.serviceNameEnum === "DTA_SERVICE_NAME"
      );
      if (!dtaService) return false;

      return Object.keys(dtaService.characterMap).some((charUuid) => {
        const characteristic = dtaService.characterMap[charUuid];
        const realVal = characteristic?.realVal?.toString();
        return realVal === scannedData;
      });
    });

    if (matchingDevice) {
      return matchingDevice; // Exact match found
    }

    // Step 2: Try partial matching
    matchingDevice = detectedDevices.find((device) => {
      const dtaService = device.services.find(
        (service) => service.serviceNameEnum === "DTA_SERVICE_NAME"
      );
      if (!dtaService) return false;

      return Object.keys(dtaService.characterMap).some((charUuid) => {
        const characteristic = dtaService.characterMap[charUuid];
        const realVal = characteristic?.realVal?.toString();
        return partialMatch(realVal, scannedData);
      });
    });

    if (matchingDevice) {
      return matchingDevice; // Partial match found
    }

    // Step 3: Use fuzzy matching as a last resort
    matchingDevice = detectedDevices.find((device) => {
      const dtaService = device.services.find(
        (service) => service.serviceNameEnum === "DTA_SERVICE_NAME"
      );
      if (!dtaService) return false;

      return Object.keys(dtaService.characterMap).some((charUuid) => {
        const characteristic = dtaService.characterMap[charUuid];
        const realVal = characteristic?.realVal?.toString();
        return fuzzyMatch(realVal, scannedData);
      });
    });

    return matchingDevice || null; // Return the matching device or null if none found
  };

  const handleScanData = (scannedValue) => {
    console.log("Scanned Value:", scannedValue);

    const matchingDevice = findMatchingDeviceByOpid(scannedValue);
    if (matchingDevice) {
      console.log("Matching BLE device found:", matchingDevice);
      dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
    } else {
      console.warn("No matching BLE device found for the scanned data.");
    }
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

  // Register the scanQrcodeResultCallBack to handle scanned data
  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            const scannedValue = parsedData?.respData?.value;
            const requestCode = parsedData?.respData?.requestCode;

            if (requestCode === 999) {
              console.log("Scanned data received:", scannedValue);
              handleScanData(scannedValue); // Call handleScanData with the scanned value
            } else {
              console.error(
                "Request code mismatch. Expected 999 but got:",
                requestCode
              );
            }
          } catch (error) {
            console.error("Error handling scan callback data:", error.message);
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE scan.");
    }
  }, []);

  useEffect(() => {
    if (!state.detectedDevices || state.detectedDevices.length === 0) {
      console.warn("No BLE devices detected. Starting BLE scan...");
      scanBleDevices();
    }
  }, [state.detectedDevices]);

  return (
    <div className="scan-data-page flex flex-col h-screen">
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-left">Scanned Data</h2>
        {state.scannedData && (
          <p className="text-left mt-2">{state.scannedData}</p>
        )}

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

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-left">
            BLE Connection Status:
          </h3>
          <p className="text-left text-gray-700">
            {state.bleConnectionStatus || "Not connected"}
          </p>
        </div>
      </div>

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
