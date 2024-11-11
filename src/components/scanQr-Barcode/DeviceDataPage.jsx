import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const DeviceDataPage = () => {
  const location = useLocation();
  const dataList = location.state?.dataList || [];

  // Categorize data by the specific service name attributes
  const categorizedData = {
    ATT: [],
    DTA: [],
    DIA: [],
    CMD: [],
    STS: [],
  };

  dataList.forEach((serviceData) => {
    const category = serviceData.serviceNameEnum.split("_")[0];
    if (categorizedData[category]) {
      categorizedData[category].push(serviceData);
    }
  });

  const [activeCategory, setActiveCategory] = useState("ATT");

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Device Data</h2>

      {/* Category Navigation */}
      <div className="flex space-x-4 mb-8 border-b pb-4">
        {Object.keys(categorizedData).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              activeCategory === category
                ? "bg-gray-200 text-blue-600"
                : "text-gray-500"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Display Data for Active Category */}
      <div className="grid gap-6">
        {categorizedData[activeCategory].map((serviceData, index) => (
          <div key={index} className="p-4 border rounded-md shadow-md bg-white">
            <h4 className="font-bold text-lg mb-4">
              {serviceData.serviceNameEnum.replace(/_/g, " ")}
            </h4>
            <p>
              <strong>Service UUID:</strong> {serviceData.uuid}
            </p>

            {Object.entries(serviceData.characterMap).map(
              ([uuid, characteristic]) => (
                <div key={uuid} className="mt-4 p-2 border-t">
                  <h5 className="font-semibold">
                    {characteristic.name} ({uuid})
                  </h5>
                  <p>
                    <strong>Description:</strong> {characteristic.desc}
                  </p>
                  <p>
                    <strong>Real Value:</strong>{" "}
                    {characteristic.realVal || "N/A"}
                  </p>
                  <p>
                    <strong>Properties:</strong> {characteristic.properties}
                  </p>

                  {/* Display descMap information if available */}
                  {characteristic.descMap && (
                    <div className="mt-2">
                      <h6 className="font-semibold">Descriptors:</h6>
                      {Object.entries(characteristic.descMap).map(
                        ([descUuid, descItem]) => (
                          <p key={descUuid} className="ml-4">
                            <strong>{descUuid}</strong>: {descItem.desc}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceDataPage;
