import React, { useEffect, useState } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const BleButtons = ({
  startBleScan,
  stopBleScan,
  toastMsg,
  isScanning,
  connectToBluetoothDevice,
  initBleData,
  detectedDevices,
  initBleDataResponse,
}) => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // State for loading spinner
  const [connectingMacAddress, setConnectingMacAddress] = useState(null); // State for the device being connected
  const [initializingMacAddress, setInitializingMacAddress] = useState(null); // State for the device being initialized

  useEffect(() => {
    console.log("Detected Devices in BleButtons component:", detectedDevices);
  }, [detectedDevices]);

  useEffect(() => {
    console.log("isScanning state changed:", isScanning);
  }, [isScanning]);

  useEffect(() => {
    console.log("BleButtons component rendered");
  });

  const handleStartScanClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Start BLE Scan button clicked");
    startBleScan();
  };

  const handleStopScanClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Stop BLE Scan button clicked");
    stopBleScan();
  };

  const handleConnectClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Connect to Bluetooth device clicked", macAddress);
    setConnectingMacAddress(macAddress); // Set the connecting device's MAC address

    try {
      await connectToBluetoothDevice(macAddress);
      console.log("Connected to Bluetooth device", macAddress);
    } catch (error) {
      console.error("Error connecting to Bluetooth device:", error);
      alert("Failed to connect to Bluetooth device. Please try again.");
    } finally {
      setConnectingMacAddress(null); // Reset the connecting device's MAC address
    }
  };

  const handleInitBleDataClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Initialize BLE data clicked", macAddress);
    setInitializingMacAddress(macAddress); // Set the initializing device's MAC address

    try {
      const response = await initBleData(macAddress);
      console.log("BLE Data Initialization Response:", response);

      // Dispatch the response to the store
      dispatch({ type: "SET_INIT_BLE_DATA_RESPONSE", payload: response });
    } catch (error) {
      console.error("Error during BLE Data Initialization:", error);
      alert("Failed to initialize BLE data. Please try again.");
    } finally {
      setInitializingMacAddress(null); // Reset the initializing device's MAC address
    }
  };

  const navigateToPage = (page) => {
    navigate(page, { state: { data: initBleDataResponse.dataList } });
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <button
        onClick={handleStartScanClick}
        className={`px-4 py-2 rounded-md text-white ${
          isScanning ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
        } transition-colors duration-200`}
        disabled={isScanning}
      >
        {isScanning ? "Scanning..." : "Start BLE Scan"}
      </button>
      <button
        onClick={handleStopScanClick}
        className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
        disabled={!isScanning}
      >
        Stop BLE Scan
      </button>
      <button
        className="w-48 h-12 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
        onClick={toastMsg}
      >
        Show Toast Message
      </button>

      <div className="mt-4 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">
          Detected Bluetooth Devices
        </h3>
        <div className="space-y-4">
          {detectedDevices && detectedDevices.length > 0 ? (
            detectedDevices.map((device, index) => (
              <div
                key={index}
                className="flex flex-col justify-between items-center p-4 bg-white shadow-md rounded-lg border border-gray-300"
              >
                <div>
                  <p className="font-semibold">
                    {device.name || "Unnamed Device"}
                  </p>
                  <p>MAC Address: {device.macAddress}</p>
                  <p>Rssi Number: {device.rssi}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={(e) => handleConnectClick(e, device.macAddress)}
                    className={`px-4 py-2 rounded-md border border-blue-500 text-blue-500 transition-colors duration-200 ${
                      connectingMacAddress === device.macAddress ||
                      initializingMacAddress === device.macAddress
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-100"
                    }`}
                    disabled={
                      connectingMacAddress === device.macAddress ||
                      initializingMacAddress === device.macAddress
                    }
                  >
                    {connectingMacAddress === device.macAddress
                      ? "Connecting..."
                      : "Connect"}
                  </button>
                  <button
                    onClick={(e) =>
                      handleInitBleDataClick(e, device.macAddress)
                    }
                    className={`px-4 py-2 rounded-md border border-blue-500 text-blue-500 transition-colors duration-200 ${
                      initializingMacAddress === device.macAddress ||
                      connectingMacAddress === device.macAddress
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-100"
                    }`}
                    disabled={
                      initializingMacAddress === device.macAddress ||
                      connectingMacAddress === device.macAddress
                    }
                  >
                    {initializingMacAddress === device.macAddress
                      ? "Initializing..."
                      : "Init BLE Data"}
                  </button>
                </div>
                {initBleDataResponse &&
                  initBleDataResponse.macAddress === device.macAddress && (
                    <div className="mt-2 grid grid-cols-5 gap-4">
                      <button
                        onClick={() => navigateToPage("/att")}
                        className="w-full py-2 border border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        ATT
                      </button>
                      <button
                        onClick={() => navigateToPage("/cmd")}
                        className="w-full py-2 border border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        CMD
                      </button>
                      <button
                        onClick={() => navigateToPage("/sts")}
                        className="w-full py-2 border border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        STS
                      </button>
                      <button
                        onClick={() => navigateToPage("/dta")}
                        className="w-full py-2 border border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        DTA
                      </button>
                      <button
                        onClick={() => navigateToPage("/dia")}
                        className="w-full py-2 border border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
                      >
                        DIA
                      </button>
                    </div>
                  )}
              </div>
            ))
          ) : (
            <p>No devices detected</p>
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
