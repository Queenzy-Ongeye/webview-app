import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReusableTable from "../table/table";
import { columnsData } from "../table/columns";

const BleButtons = ({
  startBleScan,
  stopBleScan,
  toastMsg,
  bleData,
  isScanning,
  detectedDevices,
  connectToBluetoothDevice
}) => {
  const [macAddress, setMacAddress] = useState("");
  const navigate = useNavigate();

  const handleViewClick = (deviceData) => {
    navigate(`/device-details/${deviceData.macAddress}`, { state: deviceData });
  };

  const columnsWithViewButton = [
    ...columnsData,
    {
      Header: "Actions",
      accessor: "actions",
      Cell: ({ row }) => (
        <button
          onClick={() => handleViewClick(row.original)}
          className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
        >
          View
        </button>
      ),
      sortType: "basic",
    },
  ];

  return (
    <div className="flex flex-col items-center space-y-4">
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
        onClick={toastMsg}
        className="px-4 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white transition-colors duration-200"
      >
        Show Toast Message
      </button>

      <div className="mt-4 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">
          Detected Bluetooth Devices
        </h3>
        <ul className="list-disc pl-5">
          {detectedDevices.map((device, index) => (
            <li key={index} onClick={() => setMacAddress(device.macAddress)}>
              {device.fullName} - {device.macAddress}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => connectToBluetoothDevice(macAddress)}
        className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
      >
        Connect to Bluetooth Device
      </button>

      <div className="mt-4 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">BLE Data</h3>
        <div className="flex flex-col items-center">
          <div className="w-full max-w-6xl p-4">
            <ReusableTable
              tableColumns={columnsWithViewButton}
              tableData={bleData}
              title="Response Data"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BleButtons;
