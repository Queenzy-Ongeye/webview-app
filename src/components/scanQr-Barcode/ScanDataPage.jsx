// ScanDataPage.jsx
import React from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { getDataByBarcode } from "../../utility/indexedDB";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  // Function to initiate the QR code scan, similar to startQrCode in Home.js
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        999, // Arbitrary request ID
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData.data);
            if (
              !parsedData ||
              !parsedData.respData ||
              !parsedData.respData.value
            ) {
              throw new Error("No valid QR or barcode scan data received");
            }
            const scannedValue = parsedData.respData.value; // Extract the scanned value (barcode/QR code)
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

  const handleScanData = (data) => {
    console.log("Scanned data received: ", data);
    if (isBarcode(data)) {
      fetchProductDetails(data); // Process barcode to fetch product details
    } else if (isQrCode(data)) {
      dispatch({ type: "SET_QR_DATA", payload: data });
      const matchingDevice = findMatchingDevice(data);

      if (matchingDevice) {
        console.log("Matching Ble device found: ", matchingDevice);
        dispatch({
          type: "SET_MATCHED_DEVICE",
          payload: { bleDevice: matchingDevice, scannedData: data },
        });
        alert(`Device matcehd : ${matchingDevice.name}`);
      } else {
        console.error("No matching BLE device found for scanned data.");
        alert("No matching BLE device found.");
      }
    } else {
      console.error("Invalid scan data. Neither a barcode nor a QR code.");
    }
  };

  const isBarcode = (data) => {
    const numericPattern = /^[0-9]+$/;
    const barcodeLengths = [8, 12, 13];
    return numericPattern.test(data) && barcodeLengths.includes(data.length);
  };

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

  const findMatchingDevice = (scannedData) => {
    const { detectedDevices } = state;
    return detectedDevices.find((device) => {
      device.name.includes(scannedData) ||
        device.macAddress.includes(scannedData);
    });
  };

  return (
    <div className="scan-data-page">
      {/* Scan QR Code Button */}
      <button
        onClick={startQrCodeScan}
        className="scan-qr-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Scan QR Code
      </button>

      {/* Render other components or state data here as necessary */}
      <div>
        <h2>Scanned Data</h2>
        {/* Display scanned QR/Barcode data here from the state */}
        {state.qrData && <p>{state.qrData}</p>}
      </div>
    </div>
  );
};

export default ScanDataPage;
