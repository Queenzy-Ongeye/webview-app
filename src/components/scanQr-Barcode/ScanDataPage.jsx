import React, { useEffect, useState, useMemo } from "react";
import { useStore } from "../../service/store";
import { IoQrCodeOutline } from "react-icons/io5";
import PopupNotification from "../notification/PopUp";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenu } from "@radix-ui/react-dropdown-menu";
import  { Button } from "../reusableCards/Buttons";

const ScanDataPage = () => {
  const { state, dispatch } = useStore();
  const [deviceQueue, setDeviceQueue] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null);
  const [loadingMap, setLoadingMap] = useState(new Map()); // Track loading per device
  const requestCode = 999;
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(null);
  const navigate = useNavigate();
  const [currentFilter, setCurrentFilter] = useState("all");

  const handleMatchResult = (found) => {
    setMatchFound(found);
    setPopupVisible(true);
  };

  // Function to handle "View Device Data" button click when match is found
  const handleContinue = () => {
    if (matchFound && state.initBleData) {
      navigate("/ble-data", {
        state: { deviceData: state.initBleData.dataList },
      }); // Pass data to new page
    }
    setPopupVisible(false); // Close the popup
  };

  // Function to initiate the QR/barcode scan
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      try {
        window.WebViewJavascriptBridge.callHandler(
          "startQrCodeScan",
          999,
          (responseData) => {
            const parsedResponse = JSON.parse(responseData);
            // Check if the scan initiation was successful
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

  // Register the callback handler for the scan result
  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            const scannedValue = parsedData.respData?.value;
            const callbackRequestCode = parsedData.respData?.requestCode;

            // Validate the request code to ensure it matches the original request
            if (callbackRequestCode === requestCode) {
              console.log("Scanned data received:", scannedValue);
              handleScanData(scannedValue); // Process the scanned data
            } else {
              console.error(
                "Request code mismatch. Expected:",
                requestCode,
                "Received:",
                callbackRequestCode
              );
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

  // Function to handle the scanned data after receiving it
  const handleScanData = (scannedValue) => {
    if (scannedValue) {
      console.log("Scanned Value:", scannedValue);
      dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });
      initiateDeviceQueue(); // Start pairing process
    } else {
      console.error("Invalid scan data received.");
      alert("Invalid scan data. Neither a barcode nor a QR code.");
    }
  };

  // Initiate the device queue based on the top 5 strongest signals
  const initiateDeviceQueue = () => {
    const detectedDevices = state.detectedDevices;
    if (detectedDevices && detectedDevices.length > 0) {
      const topDevices = detectedDevices
        .sort((a, b) => b.rssi - a.rssi)
        .slice(0, 5);
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
          if (parsedData.respCode === 200) {
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

  // Initiate device pairing process
  const handleConnectAndInit = async (e, macAddress) => {
    e?.preventDefault();
    e?.stopPropagation();

    // Update loading state for the specific device
    setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
    setConnectingMacAddress(macAddress);

    try {
      console.log("Connecting to Bluetooth device", macAddress);
      await connectToBluetoothDevice(macAddress);

      // Add delay and initialize BLE data as in your original code...
      setTimeout(async () => {
        console.log("Starting BLE data initialization after delay");

        // Step 3: Initialize BLE data after the delay
        const response = await initBleData(macAddress);
        dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });
        console.log("Initialized BLE data:", response);

        // Step 4: Set successful states for UI feedback
        setConnectionSuccessMac(macAddress);
        setInitSuccessMac(macAddress);
        setTimeout(() => {
          searchForMatch();
        }, 40000);

        // Clear success states after another delay
        setTimeout(() => {
          setConnectionSuccessMac(null);
          setInitSuccessMac(null);
        }, 10000); // Clear after 10 seconds
      }, 25000); // 3-second delay before starting BLE initialization

      // Wait and then search for match as in your original code...
    } catch (error) {
      console.error(
        "Error during Bluetooth connection or BLE data initialization:",
        error
      );
      alert("Failed to connect and initialize BLE data. Please try again.");
    } finally {
      setTimeout(() => {
        setConnectingMacAddress(null);
        // Clear loading state for the specific device
        setLoadingMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(macAddress, false);
          return newMap;
        });
      }, 80000);
    }
  };

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
                initBleData(macAddress);
                resolve(true); // Resolve with success
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

  const initBleData = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "initBleData",
          macAddress,
          (responseData) => {
            try {
              const parsedData = JSON.parse(responseData);
              dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
              console.log("BLE Init Data:", parsedData);
              resolve(parsedData); // Resolve the promise with the retrieved data
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

  // Search for a match in the BLE data once initialized
  const searchForMatch = () => {
    const { initBleData, scannedData } = state;

    if (!initBleData || !scannedData) {
      handleMatchResult(false);
      return;
    }

    let match = false;
    let foundDeviceData = null;
    for (const item of initBleData.dataList || []) {
      for (const characteristic of Object.values(item.characterMap || {})) {
        const { realVal, desc } = characteristic;
        if (
          (realVal && realVal.toString().includes(scannedData)) ||
          (desc && desc.includes(scannedData))
        ) {
          match = true;
          foundDeviceData = item; // Store matched device data
          console.log("Match:", characteristic);
          break;
        }
      }
      if (match) break;
    }

    handleMatchResult(match, foundDeviceData);
  };

  // useEffect hook to monitor initBleData and scannedData changes
  useEffect(() => {
    if (state.initBleData && state.scannedData && isPopupVisible) {
      // Run the search only when both initBleData and scannedData are available
      searchForMatch();
    }
  }, [state.initBleData, state.scannedData]);
  // Start scanning for BLE devices
  const scanBleDevices = () => {
    setIsScanning(true);
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        null,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData && parsedData.devices) {
              dispatch({
                type: "ADD_DETECTED_DEVICE",
                payload: parsedData.devices,
              });
            }
          } catch (error) {
            console.error("Error parsing BLE scan data:", error.message);
          } finally {
            setIsScanning(false);
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized for BLE scan.");
      setIsScanning(false);
    }
  };

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  state.detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  // Convert the Map to an array and sort by signal strength (RSSI)
  const uniqueDevice = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  // Filter and sort devices based on the current filter
  const filteredAndSortedDevices = useMemo(() => {
    let devices = Array.from(uniqueDevicesMap.values());

    switch (currentFilter) {
      case "strong":
        return devices
          .filter((device) => device.rssi > -70)
          .sort((a, b) => b.rssi - a.rssi);
      case "medium":
        return devices
          .filter((device) => device.rssi <= -70 && device.rssi > -90)
          .sort((a, b) => b.rssi - a.rssi);
      case "weak":
        return devices
          .filter((device) => device.rssi <= -90)
          .sort((a, b) => b.rssi - a.rssi);
      default:
        return devices.sort((a, b) => b.rssi - a.rssi);
    }
  }, [uniqueDevicesMap, currentFilter]);

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
  };

  useEffect(() => {
    if (
      state.detectedDevices &&
      state.detectedDevices.length > 0 &&
      state.scannedData
    ) {
      initiateDeviceQueue(); // Automatically start device queue and connection process
    } else if (!state.detectedDevices || state.detectedDevices.length === 0) {
      scanBleDevices(); // Scan for devices if no devices are detected
    }
  }, [state.detectedDevices, state.scannedData]);

  // Helper function to check if any device is loading
  const isAnyDeviceLoading = () => {
    return Array.from(loadingMap.values()).some((isLoading) => isLoading);
  };

  return (
    <div className="scan-data-page flex flex-col h-screen mt-2">
      <div className="mt-10">
        {/* Top Navigation */}
        <header className="fixed top-0 left-0 right-0 bg-[#1a2942] text-white z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <button className="p-2">
              <div className="w-6 h-0.5 bg-white mb-1"></div>
              <div className="w-6 h-0.5 bg-white mb-1"></div>
              <div className="w-6 h-0.5 bg-white"></div>
            </button>
            <button
              onClick={startQrCodeScan}
              className="flex items-center space-x-4"
            >
              <Camera className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 mt-16 px-4 pb-20">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold">Devices</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600 border-gray-300"
                  >
                    <span className="mr-1">↑↓</span>
                    Filter
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleFilterChange("all")}>
                    All Signals
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterChange("strong")}
                  >
                    Strong Signal (-70 dBm)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterChange("medium")}
                  >
                    Medium Signal (-90 to -70 dBm)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("weak")}>
                    Weak Signal (-90 dBm)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Device List */}
          <div className="space-y-3">
            {filteredAndSortedDevices.map((device) => (
              <div
                key={device.macAddress}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900">
                      {device.name || "Unknown Device"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {device.macAddress.toLowerCase()}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      {device.rssi > -50 ? (
                        <Wifi className="h-4 w-4 text-green-500 mr-1" />
                      ) : device.rssi > -70 ? (
                        <Wifi className="h-4 w-4 text-yellow-500 mr-1" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      {device.rssi}dBm
                    </div>
                  </div>
                  <Button
                    onClick={(e) => handleConnectAndInit(e, device.macAddress)}
                    disabled={loadingMap.get(device.macAddress)}
                    className={`min-w-[100px] ${
                      loadingMap.get(device.macAddress)
                        ? "bg-gray-400"
                        : "bg-[#008080] hover:bg-[#006666]"
                    }`}
                  >
                    {loadingMap.get(device.macAddress) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </main>

        <button
          onClick={startQrCodeScan}
          className="fixed bottom-20 right-3 w-16 h-16 bg-oves-blue rounded-full shadow-lg flex items-center justify-center"
        >
          <IoQrCodeOutline className="text-2xl text-white" />
        </button>
      </div>
      {isAnyDeviceLoading() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Connecting to device...</p>
          </div>
        </div>
      )}
      {isPopupVisible && (
        <PopupNotification
          matchFound={matchFound}
          onClose={() => setPopupVisible(false)}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
};

export default ScanDataPage;
