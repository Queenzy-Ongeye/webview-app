import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BleButtons = ({
  startBleScan,
  stopBleScan,
  toastMsg,
  bleData,
  isScanning,
  connectToBluetoothDevice,
  detectedDevices,
  startQrCode,
  jump2MainActivity
}) => {
  const [macAddress, setMacAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Detected Devices in BleButtons component:", detectedDevices);
  }, [detectedDevices]);

  const handleViewClick = (deviceData) => {
    navigate(`/device-details/${deviceData.macAddress}`, { state: deviceData });
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <button
        onClick={startBleScan}
        className={`px-4 py-2 rounded-md text-white ${
          isScanning ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
        } transition-colors duration-200`}
        disabled={isScanning}
      >
        {isScanning ? "Scanning..." : "Start BLE Scan"}
      </button>
      <button
        onClick={stopBleScan}
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
          {detectedDevices.map((device, index) => (
            <div key={index} className="flex justify-between items-center p-4 bg-white shadow-md rounded-lg border border-gray-300">
              <div>
                <p className="font-semibold">{device.name}</p>
                <p>MAC Address: {device.macAddress}</p>
              </div>
              <button
                onClick={() => connectToBluetoothDevice(device.macAddress)}
                className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BleButtons;
