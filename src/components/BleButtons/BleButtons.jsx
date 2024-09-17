import React, { useState } from "react";
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
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [initializingMacAddress, setInitializingMacAddress] = useState(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false); // Separate success for connection
  const [initSuccess, setInitSuccess] = useState(false); // Separate success for initialization
  const [loading, setLoading] = useState(false);

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  const uniqueDevice = Array.from(uniqueDevicesMap.values());

  const handleConnectClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setConnectingMacAddress(macAddress);
    setLoading(true);

    try {
      await connectToBluetoothDevice(macAddress);
      console.log("Connected to Bluetooth device", macAddress);
      setConnectionSuccess(true); // Set success when connected
      setTimeout(() => setConnectionSuccess(false), 10000); // Hide success after 10 seconds
    } catch (error) {
      console.error("Error connecting to Bluetooth device:", error);
      alert("Failed to connect to Bluetooth device. Please try again.");
    } finally {
      setConnectingMacAddress(null);
      setLoading(false);
    }
  };

  const handleInitBleDataClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setInitializingMacAddress(macAddress);
    setLoading(true);

    try {
      const response = await initBleData(macAddress);
      dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });
      setInitSuccess(true); // Set success when initialized
      setTimeout(() => setInitSuccess(false), 10000); // Hide success after 10 seconds
    } catch (error) {
      console.error("Error during BLE Data Initialization:", error);
      alert("Failed to initialize BLE data. Please try again.");
    } finally {
      setInitializingMacAddress(null);
      setLoading(false);
    }
  };

  const navigateToPage = (page, serviceNameEnum) => {
    const filteredData = initBleDataResponse?.dataList.filter(
      (item) => item.serviceNameEnum === serviceNameEnum
    );
    navigate(page, { state: { data: filteredData } });
  };

  return (
    <div>
      <div className="mt-8 w-full max-w-md mx-auto my-auto overflow-hidden">
        <h3 className="text-lg sm:text-xl text-black font-semibold mb-4">
          Detected Bluetooth Devices
        </h3>
        <div className="relative h-96 overflow-y-auto">
          {uniqueDevice.length > 0 ? (
            uniqueDevice.map((device, index) => (
              <div
                key={index}
                className="flex flex-col justify-between w-full items-center p-4 bg-white shadow-lg rounded-lg border border-gray-300 transition-transform transform hover:scale-105 mb-4 last:mb-0"
              >
                <div className="w-full">
                  <p className="font-semibold">
                    {device.name || "Unnamed Device"}
                  </p>
                  <p className="text-sm text-gray-500">
                    MAC Address: {device.macAddress}
                  </p>
                  <p className="text-sm text-gray-500">RSSI: {device.rssi}</p>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={(e) => handleConnectClick(e, device.macAddress)}
                    disabled={
                      isLoading || connectingMacAddress === device.macAddress
                    }
                    className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                      connectingMacAddress === device.macAddress
                        ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                        : connectionSuccess &&
                          connectingMacAddress !== device.macAddress
                        ? "bg-green-500 text-white"
                        : "bg-cyan-600 text-white hover:bg-cyan-700"
                    }`}
                  >
                    {connectingMacAddress === device.macAddress
                      ? "Connecting..."
                      : connectionSuccess
                      ? "Connected"
                      : "Connect"}
                  </button>
                  <button
                    onClick={(e) =>
                      handleInitBleDataClick(e, device.macAddress)
                    }
                    disabled={
                      isLoading || initializingMacAddress === device.macAddress
                    }
                    className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                      initializingMacAddress === device.macAddress
                        ? "bg-gray-500 text-white cursor-not-allowed animate-pulse"
                        : initSuccess &&
                          initializingMacAddress !== device.macAddress
                        ? "bg-green-500 text-white"
                        : "bg-cyan-700 text-white"
                    }`}
                  >
                    {isLoading
                      ? "Initializing..."
                      : initSuccess
                      ? "Initialized"
                      : "Init BLE Data"}
                  </button>
                </div>
                {/* Success Icons and additional controls are conditionally displayed here. */}
              </div>
            ))
          ) : (
            <p className="text-black">No devices detected</p>
          )}
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white" />
        </div>
      )}
    </div>
  );
};

export default BleButtons;
