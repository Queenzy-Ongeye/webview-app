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
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [initializingMacAddress, setInitializingMacAddress] = useState(null);
  const [connectionSuccessMac, setConnectionSuccessMac] = useState(null); // Track successful connection per MAC
  const [initSuccessMac, setInitSuccessMac] = useState(null); // Track successful initialization per MAC
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  const uniqueDevice = Array.from(uniqueDevicesMap.values());
  // Combined handler for connecting and initializing BLE data
  const handleConnectAndInitClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate if macAddress is provided
    if (!macAddress) {
      console.error("No MAC address provided");
      alert("MAC address is invalid or missing");
      return;
    }

    setConnectingMacAddress(macAddress);
    setLoading(true); // Start loading indicator for the connection and initialization process

    try {
      // Step 1: Connect to the Bluetooth device
      await connectToBluetoothDevice(macAddress);
      console.log("Connected to Bluetooth device", macAddress);

      // Step 2: Initialize BLE data after successful connection
      const response = await initBleData(macAddress);

      if (!response) {
        throw new Error("BLE data initialization failed");
      }

      // Dispatch the initialization response to the store
      dispatch({ type: "SET_INIT_BLE_DATA", payload: response });

      // If both connection and initialization are successful, set success state
      setTimeout(() => {
        setConnectionSuccessMac(macAddress);
        setTimeout(() => setConnectionSuccessMac(null), 10000); // Clear success state after 10 seconds
      }, 10000); // Adjust this delay as per your BLE connection timing
    } catch (error) {
      // Improved error logging and alert
      console.error(
        "Error connecting and initializing BLE data:",
        error.message || error
      );
      alert("Failed to connect and initialize BLE data. Please try again.");
      setConnectionSuccessMac(null); // Clear any success indicator in case of error
    } finally {
      // Ensure the loading state is cleared after operation completes
      setTimeout(() => {
        setConnectingMacAddress(null);
        setLoading(false);
      }, 10000); // Adjust this timeout based on how long the initialization process takes
    }
  };

  const navigateToPage = (page, serviceNameEnum) => {
    const filteredData = initBleDataResponse?.dataList.filter(
      (item) => item.serviceNameEnum === serviceNameEnum
    );
    navigate(page, { state: { data: filteredData } });
  };

  // MQTT Connection
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
                className="flex items-left justify-between w-full p-4 bg-white shadow rounded-lg border border-gray-200 transition-transform transform hover:scale-105"
              >
                {/* Device Information (Name and MAC Address) */}
                <div className="flex-1">
                  <p className="font-semibold">
                    {device.name || "Unnamed Device"}
                  </p>
                  <p className="text-sm text-gray-500">
                    MAC Address: {device.macAddress}
                  </p>

                  {/* Button to connect and initialize */}
                  <button
                    onClick={(e) =>
                      handleConnectAndInitClick(e, device.macAddress)
                    }
                    className={`px-4 py-2 border rounded-md transition-colors duration-300 ml-4 ${
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
                      ? "Connecting and Initializing..."
                      : connectionSuccessMac === device.macAddress
                      ? "Connected and Initialized"
                      : "Connect and Init"}
                  </button>
                </div>
                {connectionSuccessMac === device.macAddress && (
                  <div className="mt-2">
                    <FaCheckCircle className="text-green-500" size={24} />
                  </div>
                )}
                {initBleDataResponse &&
                  initBleDataResponse.macAddress === device.macAddress && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <button
                        onClick={() =>
                          navigateToPage("/att", "ATT_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
                      >
                        ATT
                      </button>
                      <button
                        onClick={() =>
                          navigateToPage("/cmd", "CMD_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
                      >
                        CMD
                      </button>
                      <button
                        onClick={() =>
                          navigateToPage("/sts", "STS_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
                      >
                        STS
                      </button>
                      <button
                        onClick={() =>
                          navigateToPage("/dta", "DTA_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
                      >
                        DTA
                      </button>
                      <button
                        onClick={() =>
                          navigateToPage("/dia", "DIA_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
                      >
                        DIA
                      </button>
                      <button
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
                        onClick={handleMqttConnection}
                        disabled={isButtonDisabled}
                      >
                        Connect to MQTT
                      </button>
                      <ToastContainer />
                    </div>
                  )}
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
