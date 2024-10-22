import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheckCircle } from "react-icons/fa"; // Success Icon
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
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null); // Track successful connection per MAC
  const [loading, setLoading] = useState(false);

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  const uniqueDevice = Array.from(uniqueDevicesMap.values());

  const handleConnectAndInitClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    if (!macAddress) {
      console.error("No MAC address provided");
      alert("MAC address is invalid or missing");
      return;
    }

    setConnectingMacAddress(macAddress);
    setLoading(true);

    try {
      // Step 1: Connect to the Bluetooth device
      await connectToBluetoothDevice(macAddress);
      console.log("Connected to Bluetooth device", macAddress);

      // Step 2: Initialize BLE data after successful connection
      const response = await initBleData(macAddress);

      if (!response) {
        throw new Error("BLE data initialization failed");
      }

      dispatch({ type: "SET_INIT_BLE_DATA", payload: response });

      setTimeout(() => {
        setConnectionSuccessMac(macAddress);
        setTimeout(() => setConnectionSuccessMac(null), 10000);
        navigate("/ble-buttons", { state: { macAddress, response } });
      }, 350000);
    } catch (error) {
      console.error("Error connecting and initializing BLE data:", error.message || error);
      alert("Failed to connect and initialize BLE data. Please try again.");
      setConnectionSuccessMac(null);
    } finally {
      setTimeout(() => {
        setConnectingMacAddress(null);
        setLoading(false);
      }, 10000);
    }
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
                <div className="w-full mb-2 text-left">
                  <p className="font-semibold">
                    {device.name || "Unnamed Device"}
                  </p>
                  <p className="text-sm text-gray-500">
                    MAC Address: {device.macAddress}
                  </p>
                </div>
                <div className="flex justify-between w-full mt-4 space-x-2">
                  <button
                    onClick={(e) => handleConnectAndInitClick(e, device.macAddress)}
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
