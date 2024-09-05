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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // New state for success animations

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
      setSuccess(true); // Set success when connected
      setTimeout(() => setSuccess(false), 10000); // Hide success after 3 seconds
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
      <div className="mt-8 w-full max-w-md mx-2 my-auto overflow-auto">
        <h3 className="text-lg sm:text-xl text-black font-semibold mb-2 sm:mb-4">
          Detected Bluetooth Devices
        </h3>
        <div className="space-y-4">
          {uniqueDevice.length > 0 ? (
            uniqueDevice.map((device, index) => (
              <div
                key={index}
                className="flex flex-col justify-between w-full items-center p-4 bg-white shadow-lg rounded-lg border border-gray-300 transition-transform transform hover:scale-105 overflow-auto"
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
                <div className="space-x-2 grid grid-cols-2 w-full mt-4">
                  <button
                    onClick={(e) => handleConnectClick(e, device.macAddress)}
                    className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                      connectingMacAddress === device.macAddress
                        ? "bg-gray-600 text-white cursor-not-allowed animate-pulse" // Pulse animation when connecting
                        : success
                        ? "bg-green-500 text-white"
                        : "bg-cyan-600 text-white hover:bg-cyan-700"
                    }`}
                    disabled={
                      isLoading || connectingMacAddress === device.macAddress
                    }
                  >
                    {connectingMacAddress === device.macAddress
                      ? "Connecting..."
                      : success
                      ? "Connected"
                      : "Connect"}
                  </button>
                  <button
                    onClick={(e) =>
                      handleInitBleDataClick(e, device.macAddress)
                    }
                    className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${
                      initializingMacAddress === device.macAddress
                        ? "bg-gray-500 text-white cursor-not-allowed animate-pulse" // Pulse animation for BLE Data initialization
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    disabled={
                      isLoading || initializingMacAddress === device.macAddress
                    }
                  >
                    {initializingMacAddress === device.macAddress
                      ? "Initializing..."
                      : "Init BLE Data"}
                  </button>
                </div>
                {/* Success Icon for a Connected Device */}
                {success && connectingMacAddress !== device.macAddress && (
                  <div className="flex justify-center items-center mt-2">
                    <FaCheckCircle className="text-green-500" size={24} />
                  </div>
                )}
                {initBleDataResponse &&
                  initBleDataResponse.macAddress === device.macAddress && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full overflow-x-auto">
                      <button
                        onClick={() =>
                          navigateToPage("/att", "ATT_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        ATT
                      </button>
                      <button
                        onClick={() =>
                          navigateToPage("/cmd", "CMD_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        CMD
                      </button>
                      <button
                        onClick={() =>
                          navigateToPage("/sts", "STS_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        STS
                      </button>
                      <button
                        onClick={() =>
                          navigateToPage("/dta", "DTA_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        DTA
                      </button>
                      <button
                        onClick={() =>
                          navigateToPage("/dia", "DIA_SERVICE_NAME")
                        }
                        className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        DIA
                      </button>
                    </div>
                  )}
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
