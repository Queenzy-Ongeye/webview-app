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
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const SESSION_TIMEOUT = 30000; // 30 seconds session timeout

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
      // In the scan result handler, set progress bar when data is received
      window.WebViewJavascriptBridge.registerHandler(
        "scanQrcodeResultCallBack",
        (data) => {
          try {
            const parsedData = JSON.parse(data);
            const scannedValue = parsedData.respData?.value;
            const callbackRequestCode = parsedData.respData?.requestCode;

            if (callbackRequestCode === requestCode) {
              console.log("Scanned data received:", scannedValue);

              // Update progress with more detailed stages
              setProgressStage("Processing scanned data");
              setProgress(40);

              if (!scannedValue) {
                throw new Error("No scan value received");
              }

              dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });

              // Update progress before handling scan data
              setProgressStage("Preparing device connection");
              setProgress(60);

              handleScanData(scannedValue);

              // Continue with device queue initialization
              setProgressStage("Initializing device queue");
              setProgress(80);
              initiateDeviceQueue();
            } else {
              throw new Error(
                `Request code mismatch. Expected: ${requestCode}, Received: ${callbackRequestCode}`
              );
            }
          } catch (error) {
            console.error("Error processing scan callback data:", error);

            setProgressStage("Scan processing failed");
            setProgress(0);
            setShowProgressBar(false);

            alert(`Scan processing error: ${error.message}`);
          }
        }
      );
    }
  }, []);

  const performNavigation = (deviceData, isScanConnection = false) => {
    if (isNavigating) return; // Prevent multiple navigations

    console.log("Attempting navigation with data:", {
      deviceData,
      isScanConnection,
    });

    setIsNavigating(true);

    try {
      // For manual connection, always navigate
      if (!isScanConnection && deviceData) {
        console.log(
          "Manual connection - Navigating to /ble-data with data:",
          deviceData
        );
        navigate("/ble-data", {
          state: { deviceData },
          replace: true,
        });
        setExplicitNavigationTriggered(false);
        return;
      }

      // For scan connection, verify device match
      if (isScanConnection) {
        const matchFound = checkDeviceMatch();

        if (matchFound && deviceData) {
          console.log(
            "Scan connection - Match found. Navigating to /ble-data:",
            deviceData
          );
          navigate("/ble-data", {
            state: { deviceData },
            replace: true,
          });
          setExplicitNavigationTriggered(false);
        } else {
          console.log(
            "Scan connection - No match found. Navigation prevented."
          );
          // Optionally handle no match scenario
          handleMatchResult(false);
        }
      }

      // If no valid navigation occurred
      if (!deviceData) {
        throw new Error("Navigation attempted without valid data");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setError(`Failed to navigate: ${error.message}`);
      setIsNavigating(false);
    } finally {
      // Ensure navigation state is reset
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
    console.log("startQrCodeScan called");

    // Immediately show progress bar
    setShowProgressBar(true);
    setProgressStage("Initiating QR Code Scan");
    setProgress(5);

    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        999,
        (responseData) => {
          console.log("QR Code Scan Response:", responseData);

          try {
            const parsedResponse = JSON.parse(responseData);

            // Update progress and stages more explicitly
            if (
              parsedResponse.respCode === "200" &&
              parsedResponse.respData === true
            ) {
              console.log("Scan started successfully");

              setProgressStage("Scan in progress");
              setProgress(20);

              setIsAutoConnecting(true);
              setCurrentAutoConnectIndex(0);
            } else {
              console.error("Failed to start scan:", parsedResponse.respDesc);

              // Update progress bar to show failure
              setProgressStage("Scan failed");
              setProgress(0);
              setShowProgressBar(false);

              alert("Failed to start scan. Please try again.");
            }
          } catch (error) {
            console.error("Error parsing scan response:", error);

            setProgressStage("Scan error");
            setProgress(0);
            setShowProgressBar(false);

            alert("An error occurred during scanning.");
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");

      setProgressStage("Bridge not initialized");
      setProgress(0);
      setShowProgressBar(false);

      alert("Communication bridge not ready. Please try again.");
    }
  };

  // Modify the handleScanData function
  const handleScanData = (scannedValue) => {
    if (scannedValue) {
      console.log("Scanned Value:", scannedValue);
      dispatch({ type: "SET_SCANNED_DATA", payload: scannedValue });

      // Update progress and stage
      setProgressStage("Processing scanned data");
      setProgress(30);

      initiateDeviceQueue(); // Start pairing process
    } else {
      console.error("Invalid scan data received.");
      setShowProgressBar(false);
      alert("Invalid scan data. Neither a barcode nor a QR code.");
    }
  };

  const connectToNextDevice = (queue) => {
    const currentQueue = queue || deviceQueue;

    // Set session start time if not already set
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }

    // Check for session timeout (increased to allow more time for data fetching)
    const EXTENDED_SESSION_TIMEOUT = 60000; // 60 seconds
    if (
      sessionStartTime &&
      Date.now() - sessionStartTime > EXTENDED_SESSION_TIMEOUT
    ) {
      console.log(
        "Extended session timeout reached. Stopping device connection attempts."
      );
      setShowProgressBar(false);
      setIsAutoConnecting(false);
      setCurrentAutoConnectIndex(0);
      setSessionStartTime(null);
      handleMatchResult(false);
      return;
    }

    const nextDeviceMac = currentQueue[0];
    console.log("Attempting to connect to device:", nextDeviceMac);

    setProgressStage(`Connecting to ${nextDeviceMac}`);
    setProgress(50);

    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        nextDeviceMac,
        async (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);

            if (parsedData.respCode === 200) {
              console.log(`Successfully connected to ${nextDeviceMac}`);

              setProgressStage("Initializing device data");
              setProgress(70);

              // Add a timeout for data initialization
              const initDataTimeout = new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Data initialization timeout")),
                  15000
                )
              );

              try {
                const initResponse = await Promise.race([
                  initBleData(nextDeviceMac),
                  initDataTimeout,
                ]);

                dispatch({
                  type: "SET_INIT_BLE_DATA",
                  payload: { dataList: initResponse.dataList },
                });

                const matchFound = checkDeviceMatch();

                if (matchFound) {
                  setProgress(100);
                  handleMatchResult(true);

                  // Reset session start time
                  setSessionStartTime(null);

                  // Explicitly navigate with the data
                  performNavigation(initResponse.dataList, true);
                  // navigate("/ble-data", {
                  //   state: { deviceData: initResponse.dataList },
                  //   replace: true,
                  // });
                } else {
                  console.log("No match found, trying next device");

                  const updatedQueue = currentQueue.slice(1);
                  setDeviceQueue(updatedQueue);
                  await new Promise((resolve) => setTimeout(resolve, 50000));
                  connectToNextDevice(updatedQueue);
                }
              } catch (initError) {
                console.error("Data initialization error:", initError);
                const updatedQueue = currentQueue.slice(1);
                setDeviceQueue(updatedQueue);
                await new Promise((resolve) => setTimeout(resolve, 50000));
                connectToNextDevice(updatedQueue);
              }
            } else {
              console.error(`Failed to connect to ${nextDeviceMac}`);
              const updatedQueue = currentQueue.slice(1);
              setDeviceQueue(updatedQueue);
              await new Promise((resolve) => setTimeout(resolve, 10000));
              connectToNextDevice(updatedQueue);
            }
          } catch (error) {
            console.error("Connection error:", error);
            const updatedQueue = currentQueue.slice(1);
            setDeviceQueue(updatedQueue);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            connectToNextDevice(updatedQueue);
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge not initialized");
      setShowProgressBar(false);
    }
  };

  // Modify initiateDeviceQueue to reset session start time
  const initiateDeviceQueue = () => {
    const detectedDevices = Array.from(uniqueDevicesMap.values());
    if (detectedDevices && detectedDevices.length > 0) {
      // Reset session start time when initiating queue
      setSessionStartTime(Date.now());

      const topDevices = detectedDevices
        .sort((a, b) => b.rssi - a.rssi)
        .slice(0, 5);

      // Update progress and stage
      setProgressStage(`Preparing to connect to ${topDevices.length} devices`);
      setProgress(40);

      // Create a queue of device MAC addresses
      const deviceMacQueue = topDevices.map((device) => device.macAddress);
      setDeviceQueue(deviceMacQueue);

      console.log("Top devices for connection: ", topDevices);

      // Start the connection process
      connectToNextDevice(deviceMacQueue);
    } else {
      console.warn("No BLE devices detected.");
      setShowProgressBar(false);
      alert("No devices found. Please try scanning again.");
    }
  };

  // Device matching function
  const checkDeviceMatch = () => {
    const { initBleData, scannedData } = state;

    if (!initBleData || !scannedData || !initBleData.dataList) return false;

    for (const item of initBleData.dataList) {
      if (item.characteristicList) {
        for (const characteristic of Object.values(item.characteristicList)) {
          const { valType, descriptors } = characteristic;

          // More flexible matching
          const matchConditions = [
            valType &&
              valType
                .toString()
                .toLowerCase()
                .includes(scannedData.toLowerCase()),
            descriptors &&
              descriptors.toLowerCase().includes(scannedData.toLowerCase()),
          ];

          if (matchConditions.some((condition) => condition)) {
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
      // Instead of a simple alert, use a more user-friendly popup
      handleMatchResult(false);
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
      setProgress(60);

      await initBleData(deviceToConnect.macAddress);
      setProgress(80);

      const matchFound = checkDeviceMatch();
      if (matchFound) {
        setProgress(100);
        // Use handleMatchResult to show a success popup before navigation
        handleMatchResult(true);

        // Optional: Add a slight delay to allow user to see the match found popup
        setTimeout(() => {
          performNavigation(state.initResponse.dataList, true); // Add true for scan connection
          setIsAutoConnecting(false);
        }, 1500); // 1.5 seconds delay
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

  return (
    <div className="scan-data-page flex flex-col h-screen dark:text-gray-300 bg-white dark:bg-gray-800">
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
        } px-0 w-full max-w-9xl mx-auto`}
      >
        {error && (
          <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="relative overflow-hidden">
          <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2 bg-white dark:bg-gray-800 z-10">
            <div className="bg-white dark:bg-gray-800">
              <Input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-9 bg-white dark:bg-gray-800"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 mb-2 bg-white dark:bg-gray-800">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 dark:text-gray-300">
                  <SelectItem value="rssi">Signal Strength</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 ml-2 bg-white dark:bg-gray-800">
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
          <div className="w-full max-w-9xl xs:max-w-9xl sm:max-w-9xl md:max-w-9xl relative h-screen xs:max-h-screen sm:max-h-screen md:max-h-screen lg:max-h-screen">
            {sortedAndFilteredDevices.length > 0 ? (
              <ul className="text-left">
                {sortedAndFilteredDevices.map((device) => (
                  <li
                    key={device.macAddress}
                    className="p-2 w-full max-w-9xl xs:max-w-9xl sm:max-w-9xl md:max-w-9xl border rounded-md shadow flex items-center justify-between"
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
                      className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ${
                        loadingMap.get(device.macAddress)
                          ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                          : "bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
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
      {(isAnyDeviceLoading() || isAutoConnecting) && showProgressBar && (
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
