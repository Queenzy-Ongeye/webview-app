import React, { useState } from "react";
import { columnsData } from "../table/columns";
import ReusableTable from "../table/table";

const BleButtons = ({
  startBleScan,
  stopBleScan,
  toastMsg,
  bleData,
  isScanning,
  connectToBluetoothDevice,
  detectedDevices,
}) => {
  const [macAddress, setMacAddress] = useState("");

  const columnsData = [
    {
      Header: "No",
      accessor: "",
      Cell: ({ row }) => (
        <span className="py-3.5 px-4 text-sm font-medium text-gray-700">
          {row.index + 1}
        </span>
      ),
      sortType: "basic",
    },
    {
      Header: "Address",
      accessor: "macAddress",
      sortType: "basic",
      Cell: ({ value }) => (
        <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
          {value}
        </span>
      ),
    },
    {
      Header: "Full Name",
      accessor: "fullName",
      sortType: "basic",
      Cell: ({ value }) => (
        <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
          {value}
        </span>
      ),
    },
    {
      Header: "Product Name",
      accessor: "productName",
      sortType: "basic",
      Cell: ({ value }) => (
        <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
          {value}
        </span>
      ),
    },
    {
      Header: "Product ID",
      accessor: "productId",
      sortType: "basic",
      Cell: ({ value }) => (
        <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
          {value}
        </span>
      ),
    },
    {
      Header: "TimeStamp",
      accessor: "timestampNanos",
      sortType: "basic",
      Cell: ({ value }) => (
        <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
          {value}
        </span>
      ),
    },
    {
      Header: "Connection",
      accessor: "isConnected",
      Cell: ({ value }) => (
        <span
          className={`${
            value
              ? "bg-green-500 text-white p-2 rounded-md"
              : "bg-red-500 text-white p-2 rounded-md"
          }`}
        >
          {value ? "Connected" : "Not Connected"}
        </span>
      ),
      sortType: "basic",
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: ({ row }) => (
        <button
          onClick={() => connectToBluetoothDevice(row.original.address)}
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
            <li key={index} onClick={() => setMacAddress(device.address)}>
              {device.fullName} - {device.address}
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
              tableColumns={columnsData}
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
