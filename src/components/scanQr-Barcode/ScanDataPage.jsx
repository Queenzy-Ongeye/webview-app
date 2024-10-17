import React, { useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { getDataByBarcode } from "../../utility/indexedDB";
import Button from "../BleButtons/Button";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  // Check BLE devices once component is mounted
  useEffect(() => {
    if (!state.detectedDevices || state.detectedDevices.length === 0) {
      console.warn("No BLE devices detected. Please initiate BLE scan.");
    }
  }, [state.detectedDevices]);

  // Initiate QR code scanning
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
            handleScanData(scannedValue);
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

  // Function to handle scanned data and find the matching BLE device
// Function to handle scanned data and find the matching BLE device
const handleScanData = (data) => {
  console.log("Scanned data received:", data);
  if (isBarcode(data) || isQrCode(data)) {
    console.log("Valid scan data identified.");
    dispatch({ type: "SET_SCANNED_DATA", payload: data });
    const matchingDevice = findMatchingDevice(data);
    if (matchingDevice) {
      console.log("Matching BLE device found:", matchingDevice);
      dispatch({ type: "SET_MATCHING_DEVICE", payload: matchingDevice });
    } else {
      console.warn("No matching BLE device found for the scanned data.");
    }
  } else {
    console.error("Invalid scan data. Neither a barcode nor a QR code.");
  }
};

// Function to check if the data is a barcode
const isBarcode = (data) => {
  console.log("Checking if data is a barcode:", data);
  const alphanumericPattern = /^[a-zA-Z0-9]+$/; // Allow alphanumeric barcodes
  const minLength = 6; // Minimum length for barcode
  const maxLength = 20; // Maximum length for barcode

  const isAlphanumeric = alphanumericPattern.test(data);
  const isCorrectLength = data.length >= minLength && data.length <= maxLength;

  if (!isAlphanumeric) {
    console.log("Data is not alphanumeric.");
  }
  if (!isCorrectLength) {
    console.log(`Data length is not within ${minLength}-${maxLength} range.`);
  }
  
  return isAlphanumeric && isCorrectLength;
};

// Function to check if the data is a QR code
const isQrCode = (data) => {
  console.log("Checking if data is a QR code:", data);
  const urlPattern = /^(http|https):\/\/[^ "]+$/; // Check if data is a URL
  const structuredDataPattern = /^[a-zA-Z0-9]+=[a-zA-Z0-9]+(&[a-zA-Z0-9]+=[a-zA-Z0-9]+)*$/; // Key-value pairs
  const isNonNumeric = /[^0-9]/.test(data); // Contains non-numeric characters

  const isUrl = urlPattern.test(data);
  const isStructured = structuredDataPattern.test(data);
  const isLongEnough = data.length > 20 && isNonNumeric;

  if (!isUrl && !isStructured && !isLongEnough) {
    console.log("Data does not match QR code patterns.");
  }

  return isUrl || isStructured || isLongEnough;
};

// Find a BLE device that matches the scanned data using the last 6 digits
const findMatchingDevice = (scannedData) => {
  const detectedDevices = state.detectedDevices; // Access detectedDevices from the state
  if (!detectedDevices || detectedDevices.length === 0) {
    console.warn("No BLE devices detected.");
    return null;
  }

  // Extract the last 6 characters of the scanned data
  const last6Digits = scannedData.slice(-6);

  // Match the device whose name ends with the same last 6 characters
  return detectedDevices.find((device) => {
    const { name } = device;
    return name && name.slice(-6) === last6Digits;
  });
};


  // // Function to fetch product details from IndexedDB based on barcode
  // const fetchProductDetails = (barcode) => {
  //   getDataByBarcode(barcode)
  //     .then((product) => {
  //       if (product) {
  //         dispatch({ type: "SET_QR_DATA", payload: product }); // Set the product data in state
  //       } else {
  //         console.error("Product not found for barcode:", barcode);
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching product details:", error);
  //     });
  // };

  return (
    <div className="scan-data-page">
      <div className="mt-14">
        <h2>Scanned Data</h2>
        {/* Display the scanned QR/Barcode data */}
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
      </div>

      {/* QR Code scanning button */}
      <div className="fixed bottom-0 left-0 w-full z-10 row-start-auto bg-cyan-500">
        <Button
          onClick={startQrCodeScan}
          className="bg-white text-cyan-700 mx-20 w-52"
        >
          Scan QR Code
        </Button>
      </div>
    </div>
  );
};

export default ScanDataPage;
