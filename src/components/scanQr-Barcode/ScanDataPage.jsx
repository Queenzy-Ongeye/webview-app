// ScanDataPage.jsx
import React, { useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { getDataByBarcode } from "../../utility/indexedDB";
import Button from "../BleButtons/Button";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Make sure BLE devices are scanned and stored in state
    if (!state.detectedDevices || state.detectedDevices.length === 0) {
      console.warn("No BLE devices detected. Please initiate BLE scan.");
    }
  }, [state.detectedDevices]);

  // Function to initiate the QR code scan
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
      dispatch({ type: "SET_BARCODE_DATA", payload: data });
      const matchedDevice = findMatchingDevice(data);

      if (matchedDevice) {
        console.log("Matching BLE device found: ", matchedDevice);
        dispatch({
          type: "SET_MATCHING_DEVICE",
          payload: { bleDevice: matchedDevice, scannedData: data },
        });
        alert(`Device matched: ${matchedDevice.name}`);
      } else {
        console.error("No matching BLE device found for scanned data.");
        alert("No matching BLE device found.");
      }
      // fetchProductDetails(data); // Process barcode to fetch product details
    } else if (isQrCode(data)) {
      dispatch({ type: "SET_QR_DATA", payload: data });
      const matchingDevice = findMatchingDevice(data);

      if (matchingDevice) {
        console.log("Matching BLE device found: ", matchingDevice);
        dispatch({
          type: "SET_MATCHED_DEVICE",
          payload: { bleDevice: matchingDevice, scannedData: data },
        });
        alert(`Device matched: ${matchingDevice.name}`);
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

    // Ensure there are BLE devices to compare against
    if (!detectedDevices || detectedDevices.length === 0) {
      console.warn("No BLE devices detected.");
      return null;
    }

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
        {/* Display scanned QR/Barcode data here from the state */}
        {state.qrData && <p>{state.qrData}</p>}
      </div>
      <div className="fixed bottom-0 left-0 w-full z-10 row-start-auto bg-cyan-500">
        <Button
          onClick={startQrCodeScan}
          className="bg-white text-cyan-700 mx-20 w-52"
        >
          ScanQrCode
        </Button>
      </div>
    </div>
  );
};

export default ScanDataPage;
