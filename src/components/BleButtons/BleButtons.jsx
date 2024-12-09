import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useStore } from "../../service/store";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, Loader2, Wifi, WifiOff, ChevronDown } from "lucide-react";
import BleDataPage from "./BleDataPage";
import { Button } from "../reusableCards/Buttons";
import { Input } from "../reusableCards/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../reusableCards/select";
import PopupNotification from "../notification/PopUp";
import { ProgressBar } from "../reusableCards/progresBar";
import { MdOutlineTouchApp } from "react-icons/md";

const BleButtons = () => {
  const { dispatch, state } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null);
  const [loadingMap, setLoadingMap] = useState(new Map());
  const [error, setError] = useState(null);
  const [showBleDataPage, setShowBleDataPage] = useState(false); // Control rendering of BleDataPage
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [isQrScanConnection, setIsQrScanConnection] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [currentAutoConnectIndex, setCurrentAutoConnectIndex] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [progressStage, setProgressStage] = useState("");
  const [explicitNavigationTriggered, setExplicitNavigationTriggered] =
    useState(false);
  const requestCode = 999;
  const [deviceQueue, setDeviceQueue] = useState([]);

  const handleMatchResult = (found) => {
    setMatchFound(found);
    setPopupVisible(true);
  };

  const handleContinue = () => {
    setPopupVisible(false); // Close the popup
  };

  const isAnyDeviceLoading = () => {
    return Array.from(loadingMap.values()).some((isLoading) => isLoading);
  };

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  state.detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  // Filter and sort devices based on the current filter
  const sortedAndFilteredDevices = useMemo(() => {
    if (!uniqueDevicesMap || uniqueDevicesMap.size === 0) return [];
    let devices = Array.from(uniqueDevicesMap.values());

    if (searchTerm) {
      devices = devices.filter((device) =>
        device.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy) {
      devices.sort((a, b) => {
        if (sortBy === "rssi") {
          return sortOrder === "desc" ? b.rssi - a.rssi : a.rssi - b.rssi;
        } else if (sortBy === "name") {
          return sortOrder === "desc"
            ? b.name?.localeCompare(a.name)
            : a.name?.localeCompare(b.name);
        }
        return 0;
      });
    }

    return devices;
  }, [uniqueDevicesMap, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "bleConnectSuccessCallBack",
        (data, responseCallback) => {
          const macAddress = data.macAddress;
          if (macAddress) {
            initBleData(macAddress);
          } else {
            console.error(
              "MAC Address not found in successful connection data:",
              data
            );
          }
          responseCallback(data);
        }
      );
      window.WebViewJavascriptBridge.registerHandler(
        "bleInitDataOnProgressCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            const progressPercentage = Math.round(
              (parsedData.progress / parsedData.total) * 100
            );
            setProgress(progressPercentage);
          } catch (error) {
            console.error("Progress callback error:", error);
          }
        }
      );

      window.WebViewJavascriptBridge.registerHandler(
        "bleInitDataOnCompleteCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            console.log("Data received in completion callback:", parsedData);

            // Update application state with the fetched data
            dispatch({
              type: "SET_INIT_BLE_DATA",
              payload: { dataList: parsedData.dataList },
            });

            // Trigger navigation after updating state
            performNavigation(parsedData.dataList);
          } catch (error) {
            console.error("Completion callback error:", error);
            setError("Failed to process BLE initialization data.");
          } finally {
            setProgress(100);
            setShowProgressBar(false);
          }
        }
      );
      // In the bridge setup, register the scanQrcodeResultCallBack handler
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
    const detectedDevices = sortedAndFilteredDevices;
    if (detectedDevices && detectedDevices.length > 0) {
      const topDevices = detectedDevices
        .slice(0, 5);
      setDeviceQueue(topDevices.map((device) => device.macAddress)); // Queue MAC addresses
      console.log("Top devices here: ", topDevices);
      connectToNextDevice(); // Start the pairing process
    } else {
      console.warn("No BLE devices detected.");
    }
    console.log("Detected devices here:", detectedDevices);
  };

  // Attempt to connect to the next device in the queue
  const connectToNextDevice = () => {
    if (deviceQueue.length === 0) {
      setShowProgressBar(false); // Hide progress bar if the queue is empty
      alert("No matching device found. Please scan again.");
      return;
    }

    const nextDeviceMac = deviceQueue[0];
    console.log("Attempting to connect to:", nextDeviceMac);

    if (window.WebViewJavascriptBridge) {
      setShowProgressBar(true); // Show loading
      setProgressStage(`Connecting to ${nextDeviceMac}...`);

      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        nextDeviceMac,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData.respCode === 200) {
              console.log(`Connected to ${nextDeviceMac}`);
              setProgressStage("Fetching device data...");
              initBleData(nextDeviceMac); // Fetch initialization data
            } else {
              console.error(`Failed to connect to ${nextDeviceMac}`);
              alert("Connection failed. Trying next device...");
              setDeviceQueue((prevQueue) => prevQueue.slice(1)); // Remove the device and retry
              connectToNextDevice();
            }
          } catch (error) {
            console.error("Error during connection:", error);
            setDeviceQueue((prevQueue) => prevQueue.slice(1));
            connectToNextDevice();
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
      setShowProgressBar(false);
    }
  };

  const performNavigation = (deviceData) => {
    if (isNavigating) return; // Prevent multiple navigations

    console.log("Attempting navigation with data:", { deviceData });

    setIsNavigating(true);

    try {
      if (deviceData) {
        // Navigate immediately with the provided data
        console.log("Navigating to /ble-data with data:", deviceData);
        navigate("/ble-data", {
          state: { deviceData },
          replace: true, // Use replace to prevent back navigation issues
        });
        setExplicitNavigationTriggered(false); // Reset trigger after navigation
      } else {
        throw new Error("Navigation attempted without valid data");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setError(`Failed to navigate: ${error.message}`);
      setIsNavigating(false);
    }
  };

  // Modify handleConnectAndInit to differentiate manual and QR scan connections
  const handleConnectAndInit = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setShowBleDataPage(false);
    setIsQrScanConnection(false);
    setExplicitNavigationTriggered(true); // Set the trigger for navigation

    // Show the progress bar when the connection starts
    setShowProgressBar(true);
    setProgress(0);

    setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
    setConnectingMacAddress(macAddress);

    try {
      setProgress(10);
      await connectToBluetoothDevice(macAddress);
      await new Promise((resolve) => setTimeout(resolve, 10000));

      setProgress(50);
      const response = await initBleData(macAddress);
      setProgress(80);
      dispatch({ type: "SET_INIT_BLE_DATA", payload: response });
      setConnectionSuccessMac(macAddress);
      setInitSuccessMac(macAddress);
      setShowBleDataPage(true);
    } catch (error) {
      console.error("Connection/initialization error:", error);
      setError(error.message || "Failed to connect and initialize BLE data");
    } finally {
      // Reset progress bar and loading state after connection process finishes
      setTimeout(() => {
        setConnectingMacAddress(null);
        setLoadingMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.delete(macAddress);
          return newMap;
        });
        setShowProgressBar(false);
        setProgress(0); // Reset progress
      }, 45000);
    }
  };

  const connectToBluetoothDevice = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      console.log("Attempting to connect to device:", macAddress);

      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          try {
            console.log("Raw connection response:", responseData);
            const parsedData = JSON.parse(responseData);
            console.log("Parsed connection response:", parsedData);

            if (parsedData.respCode === "200") {
              resolve(parsedData);
            } else {
              reject(
                new Error(
                  `Connection failed: ${parsedData.respMsg || "Unknown error"}`
                )
              );
            }
          } catch (error) {
            console.error("Error parsing connection response:", error);
            reject(
              new Error(`Failed to parse connection response: ${error.message}`)
            );
          }
        }
      );
    });
  };

  const initBleData = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      console.log("Initializing BLE data for:", macAddress);

      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            console.log("Raw init response:", responseData);
            const parsedData = JSON.parse(responseData);
            console.log("Parsed init response:", parsedData);

            // if (!parsedData || !parsedData.dataList) {
            //   reject(new Error("Invalid initialization response format"));
            //   return;
            // }

            resolve(parsedData);
          } catch (error) {
            console.error("Error parsing init response:", error);
            reject(
              new Error(
                `Failed to parse initialization response: ${error.message}`
              )
            );
          }
        }
      );
    });
  };

  // Function to initiate the QR/barcode scan
  const startQrCodeScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        999,
        (responseData) => {
          const parsedResponse = JSON.parse(responseData);
          if (
            parsedResponse.respCode === "200" &&
            parsedResponse.respData === true
          ) {
            // Reset auto-connection when starting a new scan
            setIsAutoConnecting(true);
            setCurrentAutoConnectIndex(0);
            console.log("Scan started, preparing auto-connection");
          } else {
            console.error("Failed to start scan:", parsedResponse.respDesc);
            alert("Failed to start scan. Please try again.");
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  // Device matching function
  const checkDeviceMatch = () => {
    const { initBleData, scannedData } = state;

    if (!initBleData || !scannedData || !initBleData.dataList) return false;

    for (const item of initBleData.dataList) {
      if (item.characterMap) {
        for (const characteristic of Object.values(item.characterMap)) {
          const { realVal, desc } = characteristic;

          if (
            (realVal && realVal.toString().includes(scannedData)) ||
            (desc && desc.includes(scannedData))
          ) {
            console.log("Match found:", characteristic);
            return true;
          }
        }
      }
    }
    console.log("No match found for the current device.");
    return false;
  };

  // Automatic connection logic
  const autoConnectNextDevice = useCallback(async () => {
    const devices = sortedAndFilteredDevices;

    if (currentAutoConnectIndex >= devices.length) {
      setShowProgressBar(false);
      setIsAutoConnecting(false);
      setCurrentAutoConnectIndex(0);
      alert("No matching device found. Please scan again.");
      return;
    }

    const deviceToConnect = devices[currentAutoConnectIndex];
    console.log("Attempting to auto-connect to:", deviceToConnect.macAddress);

    setShowProgressBar(true);
    setProgressStage(
      `Connecting to device ${deviceToConnect.name || "Unknown"}`
    );

    try {
      await connectToBluetoothDevice(deviceToConnect.macAddress);
      setProgress(50);

      await initBleData(deviceToConnect.macAddress);
      setProgress(80);

      const matchFound = checkDeviceMatch();
      if (matchFound) {
        setProgress(100);
        navigate("/ble-data", {
          state: { deviceData: state.initBleData.dataList },
          replace: true,
        });
        setIsAutoConnecting(false);
      } else {
        console.log("No match found. Trying next device...");
        setCurrentAutoConnectIndex((prev) => prev + 1);
        setProgress(0); // Reset progress for the next device
        autoConnectNextDevice(); // Recursively try the next device
      }
    } catch (error) {
      console.error("Error during auto-connect:", error);
      setCurrentAutoConnectIndex((prev) => prev + 1);
      autoConnectNextDevice();
    }
  }, [sortedAndFilteredDevices, currentAutoConnectIndex, state.scannedData]);

  // Add an effect to watch for dataList updates during auto-connection
  useEffect(() => {
    if (isAutoConnecting && state.initBleData?.dataList) {
      const matchFound = checkDeviceMatch();
      if (matchFound) {
        navigate("/ble-data", {
          state: { deviceData: state.initBleData.dataList },
          replace: true,
        });
        setIsAutoConnecting(false);
      }
      setShowProgressBar(true);
      setProgressStage(
        `Auto-connecting: Device ${currentAutoConnectIndex + 1}`
      );
    }
  }, [
    state.initBleData,
    isAutoConnecting,
    state.scannedData,
    currentAutoConnectIndex,
  ]);

  return (
    <div className="scan-data-page flex flex-col h-screen">
      {/* Background with BleDataPage when loading */}
      <div
        className={`absolute inset-0 z-10 opacity-75 ${
          isAnyDeviceLoading() ? "block" : "hidden"
        }`}
      >
        <BleDataPage />
      </div>

      {/* Device List */}
      <div
        className={`${
          isAnyDeviceLoading() ? "hidden" : "block"
        } min-h-screen bg-gray-100 w-full relative z-0`}
      >
        {error && (
          <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="p-2 relative">
          <div className="container mx-auto px-2 fixed top-16 left-0 right-0 z-10 max-w-full bg-gray-50 md:max-w-full sm:max-w-full xs:max-w-full">
            <div className="mb-2">
              <Input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-200 mt-2"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 mb-2 ">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="rssi">Signal Strength</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 ml-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  aria-label={
                    sortOrder === "asc" ? "Sort ascending" : "Sort descending"
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-gray-600 border-gray-300"
                  onClick={startQrCodeScan}
                  aria-label="Scan QR Code"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="max-w-full xs:max-w-full sm:max-w-full md:max-w-full mt-40 mx-auto px-auto relative max-h-screen xs:max-h-screen sm:max-h-screen md:max-h-screen lg:max-h-screen">
            {sortedAndFilteredDevices.length > 0 ? (
              <ul className="text-left">
                {sortedAndFilteredDevices.map((device) => (
                  <li
                    key={device.macAddress}
                    className="p-2 max-w-full xs:max-w-full sm:max-w-full md:max-w-full border rounded-md shadow flex items-center justify-between"
                  >
                    <div>
                      <p className="text-gray-700 font-bold">
                        {device.name || "Unknown Device"}
                      </p>
                      <p className="text-gray-500 font-normal">
                        {device.macAddress.toLowerCase()}
                      </p>
                      <p className="flex items-left font-light text-gray-400">
                        {device.rssi}dBm
                      </p>
                    </div>
                    <button
                      onClick={(e) =>
                        handleConnectAndInit(e, device.macAddress)
                      }
                      className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 ${
                        loadingMap.get(device.macAddress)
                          ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                          : "bg-oves-blue text-white"
                      }`}
                      disabled={loadingMap.get(device.macAddress)}
                    >
                      {loadingMap.get(device.macAddress)
                        ? "Processing..."
                        : "Connect"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No BLE devices detected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Loading Spinner Overlay */}
      {isAnyDeviceLoading() && showProgressBar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <ProgressBar progress={progress} />
            <p className="text-gray-700 mt-4">{progressStage}</p>
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

export default React.memo(BleButtons);
