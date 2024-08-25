import React from "react";

const BottomActionBar = ({
  onStartScan,
  onStopScan,
  onSettings,
  isScanning,
}) => {
  return (
    <div className="bg-cyan-500 text-white py-2 flex justify-around">
      <button
        className={`py-2 px-4 bg-white text-cyan-500 rounded hover:bg-gray-100 ${
            isScanning ? "bg-gray-500 text-white" : "bg-white"
          } transition-colors duration-200 ease-in-out`}
        onClick={onStartScan}
        disabled={isScanning}
      >
        {isScanning ? "Scanning..." : "Start BLE Scan"}
      </button>
      <button
        className="py-2 px-4 bg-white text-cyan-500 rounded hover:bg-gray-100"
        onClick={onStopScan}
      >
        Stop Scan
      </button>
      <button
        className="py-2 px-4 bg-white text-cyan-500 rounded hover:bg-gray-100"
        onClick={onSettings}
      >
        Settings
      </button>
    </div>
  );
};

export default BottomActionBar;
