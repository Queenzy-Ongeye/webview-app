import React, {useState, useEffect} from "react";
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
              parsedResponse.respData === true
            ) {
              console.log("Scan started successfully.");
            } else {
              console.error("Failed to start scan:", parsedResponse.respDesc);
              alert("Failed to start scan. Please try again.");
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

  // Register callback handler for scan result
  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            const scannedValue = parsedData.respData?.value;

            if (scannedValue) {
              setScannedData(scannedValue);
              // Immediately start scanning for BLE devices
              scanBleDevices();
            } else {
              console.error("Invalid scan data received.");
              alert("Invalid scan data. Neither a barcode nor a QR code.");
            }
          } catch (error) {
            console.error(
              "Error processing scan callback data:",
              error.message
            );
          }
        }
      );
    }
  }, []);
  // Scan BLE devices
  const scanBleDevices = () => {
    if (window.WebViewJavascriptBridge) {
      setMatchStatus((prev) => ({ ...prev, searching: true }));
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        null,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);

            // Check if parsedData contains valid device information
            if (parsedData && parsedData.data) {
              const device = JSON.parse(parsedData.data); // Parse the inner `data` field

              // Add device to the global store
              dispatch({ type: "ADD_DETECTED_DEVICE", payload: device });
            } else {
              console.error("Invalid device data format:", parsedData);
            }

            dispatch({ type: "SET_BLE_DATA", payload: parsedData });
          } catch (error) {
            console.error("Error parsing BLE scan data:", error.message);
            setMatchStatus((prev) => ({
              ...prev,
              searching: false,
              message: "Error scanning devices",
            }));
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE scan.");
    }
  };

  // Connect to device and check for match
  const connectAndMatchNextDevice = (device) => {
    if (!device) {
      // No more devices to check
      setMatchStatus({
        searching: false,
        matchFound: false,
        message: "No matching device found",
      });
      return;
    }

    // Connect to the device
    connectToBluetoothDevice(device.macAddress)
      .then(initBleData)
      .then((bleData) => {
        // Check for match in the BLE data
        const match = checkForMatch(bleData, scannedData);

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
            connectAndMatchNextDevice(state.detectedDevices[nextIndex]);
          } else {
            // No more devices to check
            setMatchStatus({
              searching: false,
              matchFound: false,
              message: "No matching device found",
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
          connectAndMatchNextDevice(state.detectedDevices[nextIndex]);
        } else {
          // No more devices to check
          setMatchStatus({
            searching: false,
            matchFound: false,
            message: "No matching device found",
          });
        }
      });
  };

  // Render component with match status and actions
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

      {/* Display the scanned devices */}
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
