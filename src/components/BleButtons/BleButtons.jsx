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

  // const handleFilterChange = (filter) => {
  //   setCurrentFilter(filter);
  // };

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

      // In the bridge setup, register the scanQrcodeResultCallBack handler
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack",
        (data, responseCallback) => {
          console.log("Raw scan data received:", data);

          try {
            // Add more flexible parsing
            const parsedData =
              typeof data === "string" ? JSON.parse(data) : data;

            console.log("Parsed scan data:", parsedData);

            // Dispatch with more robust payload handling
            dispatch({
              type: "SET_SCANNED_DATA",
              payload: parsedData,
            });

            // Set QR scan connection flag
            setIsQrScanConnection(true);

            // Trigger auto-connection process
            setIsAutoConnecting(true);
            setCurrentAutoConnectIndex(0);

            responseCallback({
              success: true,
              message: "Scan data processed successfully",
            });
          } catch (error) {
            console.error(
              "Comprehensive error parsing scan data:",
              error.message,
              "Original data:",
              data
            );

            // More informative error response
            responseCallback({
              success: false,
              error: error.message,
              originalData: data,
            });
          }
        }
      );
    }
  }, []);

  // Watch for changes in initBleData and trigger navigation
  useEffect(() => {
    if (state.initBleData?.dataList && !isNavigating) {
      performNavigation();
    }
  }, [state.initBleData]);

  const performNavigation = () => {
    if (isNavigating) return; // Prevent multiple navigations

    console.log("Attempting navigation with data:", {
      initBleData: state.initBleData,
      dataList: state.initBleData?.dataList,
    });

    setIsNavigating(true);

    try {
      if (state.initBleData?.dataList) {
        // Ensure we have the data before navigating
        const deviceData = state.initBleData.dataList;

        // Use a short timeout to ensure state updates have completed
        setTimeout(() => {
          console.log("Navigating to /ble-data with data:", deviceData);
          setProgress(100);
          navigate("/ble-data", {
            state: { deviceData },
            replace: true, // Use replace to prevent back navigation issues
          });
        }, 100);
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

    // Show the progress bar when the connection starts
    setShowProgressBar(true);
    setProgress(0);

    setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
    setConnectingMacAddress(macAddress);

    try {
      setProgress(10);
      await connectToBluetoothDevice(macAddress);
      setProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 25000));

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
      // Check if the item has a characterMap
      if (item.characterMap) {
        for (const characteristic of Object.values(item.characterMap)) {
          const { realVal, desc } = characteristic;

          // Check if scanned data matches either realVal or desc
          if (
            (realVal && realVal.toString().includes(scannedData)) ||
            (desc && desc.includes(scannedData))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Automatic connection logic
  const autoConnectNextDevice = useCallback(async () => {
    const devices = sortedAndFilteredDevices;

    if (currentAutoConnectIndex >= devices.length) {
      setIsAutoConnecting(false);
      setCurrentAutoConnectIndex(0);
      return;
    }

    const deviceToConnect = devices[currentAutoConnectIndex];

    try {
      await connectToBluetoothDevice(deviceToConnect.macAddress);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Short delay

      await initBleData(deviceToConnect.macAddress);

      // Wait for state to update with dataList
      const checkMatch = () => {
        return new Promise((resolve) => {
          // Use a timeout to give some time for state to update
          const checkInterval = setInterval(() => {
            if (state.initBleData?.dataList) {
              clearInterval(checkInterval);
              resolve(checkDeviceMatch());
            }
          }, 500); // Check every 500ms

          // Prevent infinite waiting
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
          }, 10000); // 10 seconds timeout
        });
      };

      const matchFound = await checkMatch();

      if (matchFound) {
        navigate("/ble-data", {
          state: { deviceData: state.initBleData.dataList },
          replace: true,
        });
        setIsAutoConnecting(false);
      } else {
        // Move to next device
        setCurrentAutoConnectIndex((prev) => prev + 1);
        // Recursively try next device
        autoConnectNextDevice();
      }
    } catch (error) {
      console.error("Auto-connection error:", error);
      // Move to next device on failure
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

  // Modify searchForMatch to use isQrScanConnection
  const searchForMatch = useCallback(() => {
    const { initBleData, scannedData } = state;

    if (!initBleData || !scannedData || !isQrScanConnection) {
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
          foundDeviceData = item;
          console.log("Match:", characteristic);
          break;
        }
      }
      if (match) break;
    }

    handleMatchResult(match, foundDeviceData);
  }, [state.initBleData, state.scannedData, isQrScanConnection]);

  // Effect to trigger search only for QR scan connections
  useEffect(() => {
    if (state.initBleData && state.scannedData && isQrScanConnection) {
      searchForMatch();
    }
  }, [
    state.initBleData,
    state.scannedData,
    isQrScanConnection,
    searchForMatch,
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
          <div className="w-full mt-36">
            {sortedAndFilteredDevices.length > 0 ? (
              <ul className="text-left">
                {sortedAndFilteredDevices.map((device) => (
                  <li
                    key={device.macAddress}
                    className="mt-2 p-0 border rounded-md shadow flex items-center justify-between"
                  >
                    <div>
                      <p className="text-gray-700 font-bold">
                        {device.name || "Unknown Device"}
                      </p>
                      <p className="text-gray-500 font-normal ">
                        {device.macAddress.toLowerCase()}
                      </p>
                      <div className="flex items-left">
                        <span className="text-sm text-gray-400 font-thin">
                          {device.rssi}dBm
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) =>
                        handleConnectAndInit(e, device.macAddress)
                      }
                      className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 ${
                        loadingMap.get(device.macAddress)
                          ? "bg-gray-400 text-gray-800 cursor-not-allowed"
                          : "bg-oves-blue hover:bg-blue-600 text-white"
                      }`}
                      disabled={loadingMap.get(device.macAddress)}
                    >
                      {loadingMap.get(device.macAddress) ? (
                        <Loader2 className="animate-spin mr-2" />
                      ) : (
                        "connect"
                      )}
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
            <p className="text-gray-700 mt-4">
              {progress < 100
                ? `Loading data... ${progress}%`
                : "Finishing up..."}
            </p>
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
