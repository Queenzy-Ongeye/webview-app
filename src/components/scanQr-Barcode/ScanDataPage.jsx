import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
const ScanDataPage = () => {
  const [scannedData, setScannedData] = useState(null);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [matchStatus, setMatchStatus] = useState({
    searching: false,
    matchFound: false,
    message: "",
  });
  const { dispatch, state } = useStore(); // Access the global store

  // Start QR/Barcode scan
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      try {
        window.WebViewJavascriptBridge.callHandler(
          "startQrCodeScan",
          999,
          (responseData) => {
            const parsedResponse = JSON.parse(responseData);

            if (
              parsedResponse.respCode === "200" &&
              parsedResponse.respData?.value
            ) {
              const barcodeValue = parsedResponse.respData.value;
              setScannedData(barcodeValue);

              // Start matching process
              startMatching(barcodeValue);
            } else {
              alert("Failed to scan barcode. Please try again.");
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

  // Start the matching process
  const startMatching = (barcodeValue) => {
    if (state.detectedDevices.length === 0) {
      setMatchStatus({
        searching: false,
        matchFound: false,
        message: "No devices detected. Please scan for devices first.",
      });
    console.log("Devices are here:", state.detectedDevices)
      return;
    }

    setMatchStatus((prev) => ({ ...prev, searching: true, message: "" }));
    setCurrentDeviceIndex(0);
    connectAndMatchNextDevice(barcodeValue, state.detectedDevices[0]);
  };

  // Connect to device and check for match
  const connectAndMatchNextDevice = (barcodeValue, device) => {
    if (!device) {
      // No more devices to check
      setMatchStatus({
        searching: false,
        matchFound: false,
        message: "No matching device found. Please scan another barcode.",
      });
      return;
    }

    // Connect to the device
    connectToBluetoothDevice(device.macAddress)
      .then(initBleData)
      .then((bleData) => {
        // Check for match in the BLE data
        const match = checkForMatch(bleData, barcodeValue);

        if (match) {
          // Match found
          setMatchStatus({
            searching: false,
            matchFound: true,
            message: `Match found with device: ${device.macAddress}`,
          });
        } else {
          // Move to next device
          const nextIndex = currentDeviceIndex + 1;
          setCurrentDeviceIndex(nextIndex);

          if (nextIndex < state.detectedDevices.length) {
            connectAndMatchNextDevice(
              barcodeValue,
              state.detectedDevices[nextIndex]
            );
          } else {
            // No more devices to check
            setMatchStatus({
              searching: false,
              matchFound: false,
              message: "No matching device found. Please scan another barcode.",
            });
          }
        }
      })
      .catch((error) => {
        console.error("Error connecting or matching device:", error);

        // Move to next device
        const nextIndex = currentDeviceIndex + 1;
        setCurrentDeviceIndex(nextIndex);

        if (nextIndex < state.detectedDevices.length) {
          connectAndMatchNextDevice(
            barcodeValue,
            state.detectedDevices[nextIndex]
          );
        } else {
          // No more devices to check
          setMatchStatus({
            searching: false,
            matchFound: false,
            message: "No matching device found. Please scan another barcode.",
          });
        }
      });
  };

  // Check for match in BLE data
  const checkForMatch = (bleData, barcodeValue) => {
    for (const item of bleData.dataList || []) {
      for (const characteristic of Object.values(item.characterMap || {})) {
        const { realVal, desc } = characteristic;
        if (
          (realVal && realVal.toString().includes(barcodeValue)) ||
          (desc && desc.includes(barcodeValue))
        ) {
          return true;
        }
      }
    }
    return false;
  };

  // Connect to Bluetooth device
  const connectToBluetoothDevice = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "connBleByMacAddress",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              if (parsedData.respCode === "200") {
                resolve(macAddress);
              } else {
                reject("Connection failed");
              }
            } catch (error) {
              console.error("Error parsing JSON data:", error);
              reject(error);
            }
          }
        );
      } else {
        console.error("WebViewJavascriptBridge is not initialized.");
        reject("WebViewJavascriptBridge not initialized");
      }
    });
  };

  // Initialize BLE data
  const initBleData = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "initBleData",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              resolve(parsedData);
            } catch (error) {
              console.error(
                "Error parsing JSON data from 'initBleData' response:",
                error
              );
              reject(error);
            }
          }
        );
      } else {
        console.error("WebViewJavascriptBridge is not initialized.");
        reject("WebViewJavascriptBridge not initialized");
      }
    });
  };

  return (
    <div className="mt-20">
      <button
        onClick={startQrCodeScan}
        className="px-4 py-2 border rounded-md ml-4 text-white bg-oves-blue"
      >
        Scan Barcode
      </button>

      {matchStatus.searching && <p>Searching for matching device...</p>}

      {matchStatus.message && (
        <p>
          {matchStatus.matchFound
            ? `Success: ${matchStatus.message}`
            : `No Match: ${matchStatus.message}`}
        </p>
      )}

      {/* Display the detected devices */}
      <ul>
        {state.detectedDevices.map((device, index) => (
          <li key={index}>
            MAC Address: {device.macAddress}, RSSI: {device.rssi}, Name:{" "}
            {device.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScanDataPage;
