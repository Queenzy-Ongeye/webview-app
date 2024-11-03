import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const DeviceDataPage = () => {
  const location = useLocation();
  const {deviceData} = location.state.initBleData || {};

  // State for active tab
  const [activeTab, setActiveTab] = useState("ATT");

  // Define the service names
  const serviceTabs = [
    { id: "ATT", name: "ATT_SERVICE_NAME" },
    { id: "CMD", name: "CMD_SERVICE_NAME" },
    { id: "STS", name: "STS_SERVICE_NAME" },
    { id: "DTA", name: "DTA_SERVICE_NAME" },
    { id: "DIA", name: "DIA_SERVICE_NAME" },
  ];

  // Filter characteristics based on the active service tab
  const getServiceCharacteristics = (serviceName) => {
    return Object.entries(deviceData.characterMap || {}).filter(
      ([, characteristic]) => characteristic.serviceUuid === serviceName
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center mb-4">Device Data</h2>

      {/* Tab Navigation */}
      <div className="flex justify-around bg-gray-100 p-2 rounded-lg mb-4">
        {serviceTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold ${
              activeTab === tab.id
                ? "text-oves-blue border-b-2 border-oves-blue"
                : "text-gray-500"
            }`}
          >
            {tab.id}
          </button>
        ))}
      </div>

      {/* Display data for active tab */}
      <div className="bg-white shadow-lg rounded-lg p-4">
        {getServiceCharacteristics(serviceTabs.find(tab => tab.id === activeTab)?.name).length > 0 ? (
          getServiceCharacteristics(serviceTabs.find(tab => tab.id === activeTab)?.name).map(([uuid, characteristic]) => (
            <div key={uuid} className="p-4 border-b last:border-b-0">
              <p className="text-lg font-medium text-gray-700">{characteristic.name}</p>
              <p className="text-sm text-gray-500 mt-1">VALUE: {characteristic.realVal || "N/A"}</p>
              <p className="text-xs text-gray-400 mt-1">{characteristic.desc || "No description available"}</p>
              <button className="text-blue-500 text-sm mt-2">READ</button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No data available for this category.</p>
        )}
      </div>
    </div>
  );
};

export default DeviceDataPage;
