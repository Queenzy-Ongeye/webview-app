import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheckCircle } from "react-icons/fa";
import { connectMqtt } from "../../service/javascriptBridge";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [lock, setLock] = useState(false); // Prevents concurrent connections
  const [activeTab, setActiveTab] = useState("ATT");

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  // Convert the Map to an array and sort by signal strength (RSSI)
  const uniqueDevice = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  const handleConnectClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent simultaneous connections
    if (lock) return;
    setLock(true);

    setConnectingMacAddress(macAddress);
    setLoading(true);

    try {
      await connectToBluetoothDevice(macAddress);
      console.log("Connected to Bluetooth device", macAddress);

      setTimeout(() => {
        setConnectionSuccessMac(macAddress);
        setTimeout(() => setConnectionSuccessMac(null), 10000);
      }, 23000);
    } catch (error) {
      console.error("Error connecting to Bluetooth device:", error);
      alert("Failed to connect to Bluetooth device. Please try again.");
      setConnectionSuccessMac(null);
    } finally {
      setTimeout(() => {
        setConnectingMacAddress(null);
        setLoading(false);
        setLock(false); // Release the lock after completion
      }, 23000);
    }
  };

  const handleInitBleDataClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    if (lock) return;
    setLock(true);

    setInitializingMacAddress(macAddress);
    setLoading(true);

    try {
      const response = await initBleData(macAddress);
      dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });

      setTimeout(() => {
        setInitSuccessMac(macAddress);
        setTimeout(() => setInitSuccessMac(null), 10000);
      }, 35000);
    } catch (error) {
      console.error("Error during BLE Data Initialization:", error);
      alert("Failed to initialize BLE data. Please try again.");
      setInitSuccessMac(null);
    } finally {
      setTimeout(() => {
        setInitializingMacAddress(null);
        setLoading(false);
        setLock(false); // Release the lock after completion
      }, 35000);
    }
  };

  const navigateToPage = (page, serviceNameEnum) => {
    const filteredData = initBleDataResponse?.dataList?.filter(
      (item) => item.serviceNameEnum === serviceNameEnum
    );
    setActiveTab(serviceNameEnum);
    navigate(page, { state: { data: filteredData } });
  };

  const handleMqttConnection = () => {
    connectMqtt();
    setIsButtonDisabled(true);
  };

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div className="mt-6 w-full max-w-full mx-auto p-4 bg-gray-50 rounded-lg shadow-lg">
        <h3 className="text-lg text-black font-semibold mb-4 text-center">
          Detected Bluetooth Devices
        </h3>
        <div className="space-y-4 overflow-y-auto max-h-screen max-w-screen">
          {uniqueDevice.length > 0 ? (
            uniqueDevice.map((device, index) => (
              <div
                key={index}
                className="flex flex-col items-left justify-between w-full p-4 bg-white shadow rounded-lg border border-gray-200 transition-transform transform hover:scale-105"
              >
                <div className="w-full mb-2">
                  <p className="font-semibold text-left">
                    {device.name || "Unnamed Device"}
                  </p>
                  <p className="text-sm text-gray-500 text-left">
                    MAC Address: {device.macAddress}
                  </p>
                  <p className="text-sm text-gray-500 text-left">
                    Signal Strength: {device.rssi}
                  </p>
                </div>
                <div className="flex justify-between w-full mt-4 space-x-2">
                  <button
                    onClick={(e) => handleConnectClick(e, device.macAddress)}
                    className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                      connectingMacAddress === device.macAddress
                        ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                        : connectionSuccessMac === device.macAddress
                        ? "bg-green-500 text-white"
                        : "bg-cyan-600 text-white hover:bg-cyan-700"
                    }`}
                    disabled={
                      isLoading || connectingMacAddress === device.macAddress
                    }
                  >
                    {connectingMacAddress === device.macAddress
                      ? "Connecting..."
                      : connectionSuccessMac === device.macAddress
                      ? "Connected"
                      : "Connect"}
                  </button>
                  <button
                    onClick={(e) =>
                      handleInitBleDataClick(e, device.macAddress)
                    }
                    className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                      initializingMacAddress === device.macAddress
                        ? "bg-gray-500 text-white cursor-not-allowed animate-pulse"
                        : initSuccessMac === device.macAddress
                        ? "bg-green-500 text-white"
                        : "bg-cyan-700 text-white"
                    }`}
                    disabled={
                      isLoading || initializingMacAddress === device.macAddress
                    }
                  >
                    {initializingMacAddress === device.macAddress
                      ? "Initializing..."
                      : initSuccessMac === device.macAddress
                      ? "Initialized"
                      : "Init BLE Data"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-black text-center">No devices detected</p>
          )}
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white" />
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default BleButtons;
