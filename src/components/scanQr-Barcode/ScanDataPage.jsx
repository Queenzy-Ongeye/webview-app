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
  const handleScanData = (data) => {
    console.log("Scanned data received:", data);
    if (isBarcode(data) || isQrCode(data)) {
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

  // Find a BLE device that matches the scanned data (by name or MAC address)
  const findMatchingDevice = (scannedData) => {
    const detectedDevices = state.detectedDevices; // Access detectedDevices from the state
    if (!detectedDevices || detectedDevices.length === 0) {
      console.warn("No BLE devices detected.");
      return null;
    }

    // Match the device either by name or MAC address
    return detectedDevices.find((device) => {
      const { name, macAddress } = device;
      return (
        (name && name.includes(scannedData)) ||
        (macAddress && macAddress.includes(scannedData))
      );
    });
  };

  // Helper functions to determine if data is a barcode or a QR code
  const isBarcode = (data) => {
    const alphanumericPattern = /^[a-zA-Z0-9]+$/; // Allow alphanumeric barcodes
    const commonBarcodeLengths = [8, 12, 13, 14, 20]; // Typical barcode lengths
    return (
      alphanumericPattern.test(data) &&
      commonBarcodeLengths.includes(data.length)
    );
  };

  const isQrCode = (data) => {
    const urlPattern = /^(http|https):\/\/[^ "]+$/; // Check if data is a URL
    const structuredDataPattern =
      /^[a-zA-Z0-9]+=[a-zA-Z0-9]+(&[a-zA-Z0-9]+=[a-zA-Z0-9]+)*$/; // Key-value pairs
    const nonNumericPattern = /[^0-9]/; // Contains non-numeric characters
    return (
      urlPattern.test(data) ||
      structuredDataPattern.test(data) ||
      (data.length > 20 && nonNumericPattern.test(data))
    );
  };

  // Function to fetch product details from IndexedDB based on barcode
  const fetchProductDetails = (barcode) => {
    getDataByBarcode(barcode)
      .then((product) => {
        if (product) {
          dispatch({ type: "SET_QR_DATA", payload: product }); // Set the product data in state
        } else {
          console.error("Product not found for barcode:", barcode);
        }
      })
      .catch((error) => {
        console.error("Error fetching product details:", error);
      });
  };

  return (
    <div className="scan-data-page">
      <div className="mt-14">
        <h2>Scanned Data</h2>
        {/* Display scanned QR/Barcode data from the state */}
        {state.scannedData && (
          <p>Scanned Data: {JSON.stringify(state.scannedData)}</p>
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
