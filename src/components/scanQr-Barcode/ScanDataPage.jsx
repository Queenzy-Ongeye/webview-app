import React, { useEffect, useState, useMemo } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import PopupNotification from "../notification/PopUp";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, Wifi, WifiOff, ChevronDown } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenu,
} from "../reusableCards/dropdown";
import { Button } from "../reusableCards/Buttons";

const ScanDataPage = () => {
  const [detectedDevices, setDetectedDevices] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [matchStatus, setMatchStatus] = useState({
    searching: false,
    matchFound: false,
    message: ''
  });

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
      setMatchStatus(prev => ({ ...prev, searching: true }));
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        null,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData && parsedData.devices) {
              setDetectedDevices(parsedData.devices);
              // Start matching process
              setCurrentDeviceIndex(0);
              connectAndMatchNextDevice(parsedData.devices[0]);
            }
          } catch (error) {
            console.error("Error parsing BLE scan data:", error.message);
            setMatchStatus(prev => ({ 
              ...prev, 
              searching: false, 
              message: "Error scanning devices" 
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
        message: "No matching device found"
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
            message: `Match found with device: ${device.macAddress}`
          });
        } else {
          // Move to next device
          const nextIndex = currentDeviceIndex + 1;
          setCurrentDeviceIndex(nextIndex);
          
          if (nextIndex < detectedDevices.length) {
            connectAndMatchNextDevice(detectedDevices[nextIndex]);
          } else {
            // No more devices to check
            setMatchStatus({
              searching: false,
              matchFound: false,
              message: "No matching device found"
            });
          }
        }
      })
      .catch((error) => {
        console.error("Error connecting or matching device:", error);
        
        // Move to next device
        const nextIndex = currentDeviceIndex + 1;
        setCurrentDeviceIndex(nextIndex);
        
        if (nextIndex < detectedDevices.length) {
          connectAndMatchNextDevice(detectedDevices[nextIndex]);
        } else {
          // No more devices to check
          setMatchStatus({
            searching: false,
            matchFound: false,
            message: "No matching device found"
          });
        }
      });
  };

  // Check for match in BLE data
  const checkForMatch = (initBleData, scannedData) => {
    for (const item of initBleData.dataList || []) {
      for (const characteristic of Object.values(item.characterMap || {})) {
        const { realVal, desc } = characteristic;
        if (
          (realVal && realVal.toString().includes(scannedData)) ||
          (desc && desc.includes(scannedData))
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

  // Render component with match status and actions
  return (
    <div>
      <button onClick={startQrCodeScan}>Scan Barcode</button>
      
      {matchStatus.searching && <p>Searching for matching device...</p>}
      
      {matchStatus.message && (
        <p>
          {matchStatus.matchFound 
            ? `Success: ${matchStatus.message}` 
            : `No Match: ${matchStatus.message}`}
        </p>
      )}
    </div>
  );
};

export default ScanDataPage;
