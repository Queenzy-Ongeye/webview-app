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
        999, // Arbitrary request ID
        (responseData) => {
          try {
            // Ensure that responseData is parsed correctly
            const parsedResponse = JSON.parse(
              responseData.data || responseData
            );

            // Check if data contains the expected fields
            if (
              parsedResponse &&
              parsedResponse.respData &&
              parsedResponse.respData.value
            ) {
              const scannedValue = parsedResponse.respData.value;
              console.log("Scanned Value:", scannedValue);
              handleScanData(scannedValue);
            } else {
              throw new Error("No valid QR or barcode scan data received");
            }
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
  const handleScanData = (scannedValue) => {
    const matchingDevice = findMatchingDevice(scannedValue);
    if (isBarcode(scannedValue)) {
      dispatch({ type: "SET_BARCODE_DATA", payload: matchingDevice });
      console.log(
        "Barcode scanned and matching device found: ",
        matchingDevice
      );
    } else if (isQrCode(scannedValue)) {
      dispatch({ type: "SET_QR_DATA", payload: matchingDevice });
      console.log(
        "QR code scanned and matching device found: ",
        matchingDevice
      );
    } else {
      console.error("Invalid scan data. Neither barcode nor QR code.");
    }
  };

  // Identify if scanned data is a barcode
  const isBarcode = (data) => {
    const numericPattern = /^[0-9]+$/;
    const barcodeLengths = [8, 12, 13]; // Typical barcode lengths
    return numericPattern.test(data) && barcodeLengths.includes(data.length);
  };

  // Identify if scanned data is a QR code
  const isQrCode = (data) => {
    const urlPattern = /^(http|https):\/\/[^ "]+$/;
    const structuredDataPattern =
      /^[a-zA-Z0-9]+=[a-zA-Z0-9]+(&[a-zA-Z0-9]+=[a-zA-Z0-9]+)*$/;
    const nonNumericPattern = /[^0-9]/;
    return (
      urlPattern.test(data) ||
      structuredDataPattern.test(data) ||
      (data.length > 20 && nonNumericPattern.test(data))
    );
  };

  // Fetch product details based on the scanned barcode
  const fetchProductDetails = (barcode) => {
    getDataByBarcode(barcode)
      .then((product) => {
        if (product) {
          dispatch({ type: "SET_QR_DATA", payload: product });
          navigate("/scan-data", { state: { scannedData: product } });
        } else {
          console.error("Product not found for barcode:", barcode);
        }
      })
      .catch((error) => {
        console.error("Error fetching product details: ", error);
      });
  };

  // Find a BLE device that matches the scanned data (by name or MAC address)
  const findMatchingDevice = (scannedData) => {
    const { detectedDevices } = state;
    if (!detectedDevices || detectedDevices.length === 0) {
      console.warn("No BLE devices detected.");
      return null;
    }

    // Match the device either by name or MAC address
    return detectedDevices.find((device) => {
      return (
        device.name.includes(scannedData) ||
        device.macAddress.includes(scannedData)
      );
    });
  };

  return (
    <div className="scan-data-page">
      <div className="mt-14">
        <h2>Scanned Data</h2>
        {/* Display scanned QR/Barcode data from the state */}
        {state.qrData && <p>Scanned QR Data: {state.qrData}</p>}
        {state.barcodeData && <p>Scanned Barcode Data: {state.barcodeData}</p>}
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
