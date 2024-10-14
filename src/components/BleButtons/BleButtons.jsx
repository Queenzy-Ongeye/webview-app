import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheckCircle } from "react-icons/fa"; // Success Icon
import { connectMqtt } from "../../service/javascriptBridge";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Function to check Bluetooth availability (Web example)
const isBluetoothAvailable = async () => {
  if (navigator.bluetooth) {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });
      return !!device;
    } catch (error) {
      return false;
    }
  }
  return false;
};

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
  const [isBluetoothOff, setIsBluetoothOff] = useState(false); // Bluetooth state

  // Check Bluetooth status on component mount
  useEffect(() => {
    const checkBluetoothStatus = async () => {
      const isAvailable = await isBluetoothAvailable();
      setIsBluetoothOff(!isAvailable);
    };

    checkBluetoothStatus();
  }, []);

  const handleConnectClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    setConnectingMacAddress(macAddress);
    setLoading(true); // Start loading indicator for the connection process

    try {
      await connectToBluetoothDevice(macAddress);
      setConnectionSuccessMac(macAddress);
      setTimeout(() => setConnectionSuccessMac(null), 10000); // Clear success state after 10 seconds
    } catch (error) {
      console.error("Error connecting to Bluetooth device:", error);
      alert("Failed to connect to Bluetooth device. Please try again.");
      setConnectionSuccessMac(null); // Clear any success indicator
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
      setInitSuccessMac(macAddress);
      setTimeout(() => setInitSuccessMac(null), 10000); // Clear success state after 10 seconds
    } catch (error) {
      console.error("Error during BLE Data Initialization:", error);
      alert("Failed to initialize BLE data. Please try again.");
      setInitSuccessMac(null);
    } finally {
      setInitializingMacAddress(null);
      setLoading(false);
    }
  };

  // Show message if Bluetooth is off
  if (isBluetoothOff) {
    return (
      <div className="flex flex-col items-center w-full">
        <p className="text-red-600 font-semibold text-lg w-full max-w-full mx-auto p-4 bg-gray-50 rounded-lg m-48">
          Bluetooth is turned off. Please enable Bluetooth to scan for devices.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div className="mt-6 w-full max-w-full mx-auto p-4 bg-gray-50 rounded-lg shadow-lg">
        <h3 className="text-lg text-black font-semibold mb-4 text-center">
          Detected Bluetooth Devices
        </h3>
        <div className="space-y-4 overflow-y-auto max-h-screen max-w-screen">
          {detectedDevices.length > 0 ? (
            detectedDevices.map((device, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-between w-full p-4 bg-white shadow rounded-lg border border-gray-200"
              >
                <p className="font-semibold">
                  {device.name || "Unnamed Device"}
                </p>
                <p className="text-sm text-gray-500">
                  MAC Address: {device.macAddress}
                </p>
                <p className="text-sm text-gray-500">RSSI: {device.rssi}</p>
                <div className="flex w-full mt-4 space-x-2">
                  <button
                    onClick={(e) => handleConnectClick(e, device.macAddress)}
                    className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                      connectingMacAddress === device.macAddress
                        ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                        : connectionSuccessMac === device.macAddress
                        ? "bg-green-500 text-white"
                        : "bg-cyan-600 text-white hover:bg-cyan-700"
                    }`}
                    disabled={connectingMacAddress === device.macAddress}
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
                    disabled={initializingMacAddress === device.macAddress}
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
    </div>
  );
};

export default BleButtons;
