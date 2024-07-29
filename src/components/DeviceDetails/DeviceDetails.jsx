import React from "react";
import { useLocation } from "react-router-dom";

const DeviceDetails = () => {
  const location = useLocation();
  const deviceData = location.state;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Device Details</h2>
      <div className="bg-white shadow-md rounded p-4">
        <div className="flex flex-col items-center mb-4">
          <h3 className="text-xl font-semibold mt-2">
            {deviceData.productName}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center">
            <p className="font-bold">opid:</p>
            <p>{deviceData.address}</p>
            <button className="text-blue-500">READ</button>
          </div>
          <div className="flex justify-between items-center">
            <p className="font-bold">ppid:</p>
            <p>{deviceData.productId}</p>
            <button className="text-blue-500">READ</button>
          </div>
          <div className="flex justify-between items-center">
            <p className="font-bold">ffid:</p>
            <p>Fleet ID placeholder</p>
            <button className="text-blue-500">READ</button>
          </div>
          <div className="flex justify-between items-center">
            <p className="font-bold">frmv:</p>
            <p>Firmware Version placeholder</p>
            <button className="text-blue-500">READ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;
