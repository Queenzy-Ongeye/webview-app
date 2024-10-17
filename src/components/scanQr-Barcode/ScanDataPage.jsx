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

  // Handle scanned data and find the matching BLE device
  const handleScanData = (data) => {
    console.log("Scanned data received:", data);
    if (isBarcode(data) || isQrCode(data)) {
      dispatch({ type: "SET_SCANNED_DATA", payload: data });
    } else {
      console.error("Invalid scan data. Neither a barcode nor a QR code.");
    }
  };

  // Function to check if the data is a barcode
  const isBarcode = (data) => {
    const numericPattern = /^[0-9]+$/; // Check if data consists only of numbers
    const barcodeLengths = [8, 12, 13]; // Common barcode lengths (EAN, UPC)
    return numericPattern.test(data) && barcodeLengths.includes(data.length);
  };

  // Function to check if the data is a QR code
  const isQrCode = (data) => {
    const urlPattern = /^(http|https):\/\/[^ "]+$/; // Check if data is a URL
    const structuredDataPattern =
      /^[a-zA-Z0-9]+=[a-zA-Z0-9]+(&[a-zA-Z0-9]+=[a-zA-Z0-9]+)*$/; // Pattern for key-value pairs
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
        {state.scannedData && <p>Scanned Data: {JSON.stringify(state.scannedData)}</p>}
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
