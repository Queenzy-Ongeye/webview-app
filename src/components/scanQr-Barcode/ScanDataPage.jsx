import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loading.json";
import stringSimilarity from "string-similarity";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // Function to handle scanned data and start pairing process
  const handleScanData = (scannedValue) => {
    console.log("Scanned Value:", scannedValue);
    setScannedBarcode(scannedValue);
    initiateDeviceQueue(); // Initialize device queue
  };

  // Initiate the device queue based on the top 5 strongest signals
  const initiateDeviceQueue = () => {
    const detectedDevices = state.detectedDevices;
    if (detectedDevices && detectedDevices.length > 0) {
      const topDevices = detectedDevices.sort((a, b) => b.rssi - a.rssi).slice(0, 5);
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

  // Initialize and check BLE data for a barcode match
  const initBleData = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          const parsedData = JSON.parse(responseData);
          const matchingDevice = findMatchingDevice(parsedData, scannedBarcode);

          if (matchingDevice) {
            console.log("Matching BLE device found:", matchingDevice);
            dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
          } else {
            alert("No match found. Trying next device...");
            setDeviceQueue((prevQueue) => prevQueue.slice(1)); // Continue with next device
            connectToNextDevice();
          }
        }
      );
    }
  };

  // Helper function to find a matching device based on the barcode
  const findMatchingDevice = (deviceData, scannedData) => {
    return deviceData.dataList.find((device) => {
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
  };

  // Start QR code scan
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
              const scannedValue = parsedData?.respData?.value;
              if (scannedValue) handleScanData(scannedValue);
            } catch (error) {
              console.error("Error parsing QR scan data:", error.message);
            }
          }
        );
        dispatch({ type: "SET_QR_SCANNING", payload: true });
      } catch (error) {
        console.error("Error starting QR scan:", error.message);
      }
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  // Start scanning for BLE devices
  const scanBleDevices = () => {
    setIsScanning(true);
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler("startBleScan", null, (responseData) => {
        try {
          const parsedData = JSON.parse(responseData);
          if (parsedData && parsedData.devices) {
            dispatch({ type: "ADD_DETECTED_DEVICE", payload: parsedData.devices });
          }
        } catch (error) {
          console.error("Error parsing BLE scan data:", error.message);
        } finally {
          setIsScanning(false);
        }
      });
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
    </div>
  );
};

export default ScanDataPage;
