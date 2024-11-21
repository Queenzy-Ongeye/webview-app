import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../reusableCards/cards";
import { Loader2, Wifi, WifiOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../reusableCards/Buttons";
import { ScrollArea } from "../reusableCards/scroll-area";

const BleButtons = ({
  connectToBluetoothDevice,
  initBleData,
  detectedDevices,
  initBleDataResponse,
  isLoading,
}) => {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null); // Track successful connection per MAC
  const [initSuccessMac, setInitSuccessMac] = useState(null); // Track successful initialization per MAC
  const [loadingMap, setLoadingMap] = useState(new Map()); // Track loading per device

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  // Convert the Map to an array and sort by signal strength (RSSI)
  const uniqueDevice = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

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
          navigate("/ble-data", {
            state: { data: response },
          });
        }, 40000);
        // Step 4: Navigate to DeviceDataPage with combined data
        const combinedData = {
          bleData: response?.dataList,
        };

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

  const navigateToPage = (page) => {
    const filteredData = initBleDataResponse?.dataList;
    // Navigate to the selected page, passing filtered data
    navigate(page, { state: { data: filteredData } });
  };

  // Helper function to check if any device is loading
  const isAnyDeviceLoading = () => {
    return Array.from(loadingMap.values()).some((isLoading) => isLoading);
  };

  return (
    <div className="scan-data-page flex flex-col h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Detected BLE Devices</CardTitle>
          <CardDescription>
            {uniqueDevice.length > 0
              ? `${uniqueDevice.length} device${
                  uniqueDevice.length > 1 ? "s" : ""
                } found`
              : "No BLE devices detected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <AnimatePresence>
              {uniqueDevice.map((device, index) => (
                <motion.div
                  key={device.macAddress}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {device.name || "Unknown Device"}
                      </CardTitle>
                      <CardDescription>{device.macAddress}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-left space-x-2">
                        {device.rssi > -50 ? (
                          <Wifi className="text-green-500" />
                        ) : device.rssi > -70 ? (
                          <Wifi className="text-yellow-500" />
                        ) : (
                          <WifiOff className="text-red-500" />
                        )}
                        <span className="text-sm text-gray-500">
                          Signal Strength: {device.rssi}dBm
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={(e) =>
                          handleConnectAndInit(e, device.macAddress)
                        }
                        disabled={loadingMap.get(device.macAddress)}
                        className="w-full bg-oves-blue text-white"
                      >
                        {loadingMap.get(device.macAddress) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
      {isAnyDeviceLoading() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Connecting to device...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BleButtons;
