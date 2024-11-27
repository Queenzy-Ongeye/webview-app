import React, { useEffect, useState, useMemo } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
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

const BleButtons = () => {
  const { dispatch, state } = useStore();
  const navigate = useNavigate();
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


  const handleMatchResult = (found) => {
    setMatchFound(found);
    setPopupVisible(true);
  };

  const handleContinue = () => {
    setPopupVisible(false); // Close the popup
  };
  // Helper to check if any device is loading
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
    return Array.from(uniqueDevicesMap.values())
      .filter((device) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "rssi") {
          return sortOrder === "desc" ? b.rssi - a.rssi : a.rssi - b.rssi;
        } else {
          return sortOrder === "desc"
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name);
        }
      });
  }, [sortBy, sortOrder, searchTerm]);

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
    }
  }, []);

  // Watch for changes in initBleData and trigger navigation
  useEffect(() => {
    if (state.initBleData?.dataList && !isNavigating) {
      console.log("Data detected, preparing to navigate:", state.initBleData);
      performNavigation();
    }
  }, [state.initBleData]);

  const performNavigation = () => {
    if (isNavigating) return; // Prevent multiple navigations

    console.log("Attempting navigation with data:", {
      initBleData: state.initBleData,
      dataList: state.initBleData?.dataList,
      isQrScanConnection: isQrScanConnection,
      matchFound: matchFound,
    });

    setIsNavigating(true);

    try {
      // For standard BLE connections, always navigate
      if (!isQrScanConnection && state.initBleData?.dataList) {
        const deviceData = state.initBleData.dataList;

        setTimeout(() => {
          console.log(
            "Navigating to /ble-data with standard BLE data:",
            deviceData
          );
          navigate("/ble-data", {
            state: { deviceData },
            replace: true,
          });
        }, 3000);
      }
      // For QR scan connections, only navigate if a match is found
      else if (
        isQrScanConnection &&
        matchFound &&
        state.initBleData?.dataList
      ) {
        const deviceData = state.initBleData.dataList;

        setTimeout(() => {
          console.log(
            "Navigating to /ble-data with matched scan data:",
            deviceData
          );
          navigate("/ble-data", {
            state: { deviceData },
            replace: true,
          });
        }, 3000);
      } else {
        throw new Error("Navigation attempted without valid data or match");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setError(`Failed to navigate: ${error.message}`);
      setIsNavigating(false);
    } finally {
      // Reset QR scan connection flag after navigation attempt
      setIsQrScanConnection(false);
    }
  };
 // Modify handleConnectAndInit to differentiate manual and QR scan connections
 const handleConnectAndInit = async (e, macAddress) => {
  e.preventDefault();
  e.stopPropagation();
  setError(null);
  setShowBleDataPage(false);

  // Reset QR scan connection flag for manual connections
  setIsQrScanConnection(false);

  setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
  setConnectingMacAddress(macAddress);

  try {
    const connectionResult = await connectToBluetoothDevice(macAddress);
    await new Promise((resolve) => setTimeout(resolve, 25000));

    const response = await initBleData(macAddress);
    dispatch({ type: "SET_INIT_BLE_DATA", payload: response });
    setConnectionSuccessMac(macAddress);
    setInitSuccessMac(macAddress);
    setShowBleDataPage(true);
  } catch (error) {
    console.error("Connection/initialization error:", error);
    setError(error.message || "Failed to connect and initialize BLE data");
  } finally {
    setTimeout(() => {
      setConnectingMacAddress(null);
      setLoadingMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.delete(macAddress);
        return newMap;
      });
    }, 50000);
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
    <div className="scan-data-page flex flex-col h-screen mt-10 w-full relative">
      {/* Background with BleDataPage when loading */}
      {isAnyDeviceLoading() && (
        <div className="absolute inset-0 z-10 opacity-75">
          <BleDataPage />
        </div>
      )}

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
        <div className="p-2">
          <div className="container mx-auto px-auto sticky top-0 z-10 bg-white w-full">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-200"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2">
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

              <div className="flex gap-2">
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
          {sortedAndFilteredDevices.length > 0 ? (
            <ul className="text-left">
              {sortedAndFilteredDevices.map((device) => (
                <li
                  key={device.macAddress}
                  className="mt-2 p-2 border rounded-md shadow flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-700">
                      {device.name || "Unknown Device"}
                    </p>
                    <p className="text-gray-700">{device.macAddress}</p>
                    <div className="flex items-left">
                      {device.rssi > -50 ? (
                        <Wifi className="text-green-500" />
                      ) : device.rssi > -70 ? (
                        <Wifi className="text-yellow-500" />
                      ) : (
                        <WifiOff className="text-red-500" />
                      )}
                      <span className="text-sm text-gray-500">
                        {device.rssi}dBm
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleConnectAndInit(e, device.macAddress)}
                    className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 ${
                      loadingMap.get(device.macAddress)
                        ? "bg-gray-400 text-gray-800 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                    disabled={loadingMap.get(device.macAddress)}
                  >
                    {loadingMap.get(device.macAddress) ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      "Connect"
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

      {/* Loading Spinner Overlay */}
      {isAnyDeviceLoading() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading data...</p>
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

export default BleButtons;
