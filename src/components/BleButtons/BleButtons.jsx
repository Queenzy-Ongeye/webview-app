import React from "react";

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
  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <button
        className="w-48 h-12 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        onClick={startBleScan}
      >
        Start BLE Scan
      </button>
      <button
        className="w-48 h-12 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
        onClick={stopBleScan}
      >
        Stop BLE Scan
      </button>
      <button
        className="w-48 h-12 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
        onClick={toastMsg}
      >
        Show Toast Message
      </button>
      <button
        className="w-48 h-12 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
        onClick={startQrCode}
      >
        Start QR Code Scan
      </button>
      <button
        className="w-48 h-12 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
        onClick={jump2MainActivity}
      >
        Jump to Main Activity
      </button>
      <button
        className="w-48 h-12 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
        onClick={connectToBluetoothDevice}
      >
        Connect to BLE Device
      </button>

      {/* Display detected devices */}
      <div className="mt-4 space-y-2">
        {detectedDevices.map((device, index) => (
          <div key={index} className="p-4 bg-white shadow-md rounded-lg">
            <p className="font-semibold">Device: {device.keyword}</p>
            <p>MAC Address: {device.macAddress}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BleButtons;
