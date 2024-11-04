import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const DeviceDataPage = () => {
  const location = useLocation();
  const { deviceData } = location.state || {};
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

  const getServiceCharacteristics = (serviceNameEnum) => {
    return (
      deviceData?.dataList?.filter(
        (item) => item.serviceNameEnum === serviceNameEnum
      ) || []
    );
  };

  // // Filter characteristics based on the active service tab
  // const getServiceCharacteristics = (serviceName) => {
  //   return Object.entries(deviceData.characterMap || {}).filter(
  //     ([, characteristic]) => characteristic.serviceUuid === serviceName
  //   );
  // };

  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold text-center mb-4">Device Data</h2>

      {/* Tab Navigation */}
      <div className="flex justify-around bg-gray-100 p-2 rounded-lg mb-4">
        {serviceTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold ${
              activeTab === tab.id
                ? "text-oves-blue border-2 bg-blue-300 border-oves-blue"
                : "text-gray-500"
            }`}
          >
            {tab.id}
          </button>
        ))}
      </div>

      {/* Display data for active tab */}
      <div className="bg-white shadow-lg rounded-md p-2">
        {getServiceCharacteristics(
          serviceTabs.find((tab) => tab.id === activeTab)?.name
        ).length > 0 ? (
          getServiceCharacteristics(
            serviceTabs.find((tab) => tab.id === activeTab)?.name
          ).map((item, index) => (
            <div key={index} className="mb-6 p-6 bg-white shadow-lg rounded-lg">
              {Object.keys(item.characterMap).map((uuid) => (
                <div key={uuid} className="mb-4 p-4 border-b last:border-b-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {item.characterMap[uuid].desc || "No Description"}
                  </h3>

                  <table className="w-full text-left mt-4 border border-gray-300 rounded-lg overflow-hidden">
                    <tbody>
                      <tr className="border-b bg-gray-50">
                        <td className="p-3 font-semibold text-gray-600">
                          Name
                        </td>
                        <td className="p-3">
                          {item.characterMap[uuid].name || "N/A"}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-semibold text-gray-600">
                          UUID
                        </td>
                        <td className="p-3">{uuid}</td>
                      </tr>
                      <tr className="border-b bg-gray-50">
                        <td className="p-3 font-semibold text-gray-600">
                          Real Value
                        </td>
                        <td className="p-3">
                          {item.characterMap[uuid].realVal || "N/A"}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-semibold text-gray-600">
                          Properties
                        </td>
                        <td className="p-3">
                          {item.characterMap[uuid].properties || "N/A"}
                        </td>
                      </tr>
                      {item.characterMap[uuid].descMap &&
                        Object.entries(item.characterMap[uuid].descMap).map(
                          ([key, value]) => (
                            <tr key={key} className="border-b">
                              <td className="p-3 font-semibold text-gray-600">
                                {key}
                              </td>
                              <td className="p-3">
                                {value.desc || "No description"}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">
            No data available for this category.
          </p>
        )}
      </div>
    </div>
  );
};

export default DeviceDataPage;
