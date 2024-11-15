import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheckCircle } from "react-icons/fa"; // Success Icon

const BleButtons = ({
  connectToBluetoothDevice,
  initBleData,
  detectedDevices,
  initBleDataResponse,
  isLoading,
}) => {
  const { dispatch, state } = useStore();
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
    e.preventDefault();
    e.stopPropagation();

    // Update loading state for the specific device
    setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
    setConnectingMacAddress(macAddress);

    try {
      console.log("Connecting to Bluetooth device", macAddress);
      await connectToBluetoothDevice(macAddress);

      // Delay to simulate initialization process
      setTimeout(async () => {
        console.log("Starting BLE data initialization after delay");

        // Step 3: Initialize BLE data after the delay
        const response = await initBleData(macAddress);

        // Dispatch the response to update the store
        dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });
        console.log("Initialized BLE data:", response);

        // Automatically navigate to DeviceDataPage with the retrieved data
        if (response?.dataList) {
          navigate("/device-data", {
            state: {
              deviceData: response.dataList, // Pass the data to the next page
            },
          });
        } else {
          console.warn("No data available to navigate");
        }

        // Clear loading states
        setConnectionSuccessMac(macAddress);
        setInitSuccessMac(macAddress);
        setTimeout(() => {
          setConnectionSuccessMac(null);
        }, 10000); // Clear success state after 10 seconds
      }, 3000); // Adjust delay as needed
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
      }, 60000); // Adjust the timeout as needed
    }
  };

  const navigateToPage = () => {
    if (initBleDataResponse?.dataList) {
      console.log("Navigating with data:", initBleDataResponse.dataList);
      navigate("/device-data", {
        state: {
          deviceData: initBleDataResponse.dataList, // Match key
        },
      });
    } else {
      console.error("No data available for navigation");
    }
  };

  // Helper function to check if any device is loading
  const isAnyDeviceLoading = () => {
    return Array.from(loadingMap.values()).some((isLoading) => isLoading);
  };

  return (
    <div className="flex flex-col items-center w-full overflow-hidden h-screen">
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-left">
          Detected BLE Devices:
        </h3>
        {uniqueDevice.length > 0 ? (
          <ul className="text-left">
            {uniqueDevice.map((device, index) => (
              <React.Fragment key={device.macAddress}>
                <li className="mt-2 p-2 border rounded-md shadow flex items-center justify-between">
                  <div>
                    <p className="text-gray-700">
                      Device Name: {device.name || "Unknown Device"}
                    </p>
                    <p className="text-gray-700">
                      Mac-Address: {device.macAddress}
                    </p>
                    <p className="text-gray-700">
                      Signal Strength: {device.rssi}db
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleConnectAndInit(e, device.macAddress)}
                    className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 ${
                      loadingMap.get(device.macAddress)
                        ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                        : "bg-cyan-700 text-white"
                    }`}
                    disabled={loadingMap.get(device.macAddress)}
                  >
                    {loadingMap.get(device.macAddress)
                      ? "Processing..."
                      : "Connect"}
                  </button>
                </li>
                {/* {initBleDataResponse &&
                  initBleDataResponse.macAddress === device.macAddress && (
                    <div className="mt-4 grid grid-cols-1 gap-4 w-full">
                      <button
                        onClick={() => navigateToPage()}
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
                      >
                        View Device Data
                      </button>
                    </div>
                  )} */}
              </React.Fragment>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No BLE devices detected.</p>
        )}
      </div>
      {isAnyDeviceLoading() && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white" />
        </div>
      )}
    </div>
  );
};

export default BleButtons;
