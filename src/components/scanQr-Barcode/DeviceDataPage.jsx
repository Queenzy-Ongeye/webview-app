import React, { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";

const CharacteristicCard = ({ characteristic, uuid }) => (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
    <div className="flex justify-between items-start">
      <h5 className="font-semibold text-blue-600">
        {characteristic.name || "Unnamed Characteristic"}
      </h5>
      <span className="text-xs text-gray-500 font-mono">{uuid}</span>
    </div>

    <div className="mt-2 space-y-2">
      {characteristic.desc && (
        <p className="text-sm">
          <span className="font-medium text-gray-700">Description:</span>{" "}
          <span className="text-gray-600">{characteristic.desc}</span>
        </p>
      )}

      {characteristic.realVal !== undefined && (
        <p className="text-sm">
          <span className="font-medium text-gray-700">Value:</span>{" "}
          <span className="font-mono text-gray-600">
            {characteristic.realVal.toString()}
          </span>
        </p>
      )}

      {characteristic.properties && (
        <p className="text-sm">
          <span className="font-medium text-gray-700">Properties:</span>{" "}
          <span className="text-gray-600">{characteristic.properties}</span>
        </p>
      )}

      {characteristic.descMap &&
        Object.keys(characteristic.descMap).length > 0 && (
          <div className="mt-3">
            <h6 className="font-medium text-gray-700 mb-2">Descriptors:</h6>
            <div className="pl-4 space-y-1">
              {Object.entries(characteristic.descMap).map(
                ([descUuid, descItem]) => (
                  <div key={descUuid} className="text-sm">
                    <span className="font-mono text-gray-500">{descUuid}:</span>{" "}
                    <span className="text-gray-600">{descItem.desc}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </div>
  </div>
);

const ServiceCard = ({ serviceData }) => (
  <div className="p-6 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <h4 className="font-bold text-lg text-gray-800">
        {serviceData.serviceNameEnum.replace(/_/g, " ")}
      </h4>
      <span className="text-xs text-gray-500 font-mono">
        {serviceData.uuid}
      </span>
    </div>

    <div className="space-y-4">
      {Object.entries(serviceData.characterMap).map(
        ([uuid, characteristic]) => (
          <CharacteristicCard
            key={uuid}
            uuid={uuid}
            characteristic={characteristic}
          />
        )
      )}
    </div>
  </div>
);

const DeviceDataPage = () => {
  const location = useLocation();
  const dataList = location.state?.deviceData || [];
  const [activeCategory, setActiveCategory] = useState("ATT");

  const categorizedData = useMemo(() => {
    const categories = {
      ATT: [],
      DTA: [],
      DIA: [],
      CMD: [],
      STS: [],
    };

    dataList.forEach((serviceData) => {
      const category = serviceData.serviceNameEnum.split("_")[0];
      if (categories[category]) {
        categories[category].push(serviceData);
      }
    });

    return categories;
  }, [dataList]);

  const availableCategories = Object.keys(categorizedData).filter(
    (category) => categorizedData[category].length > 0
  );

  if (dataList.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            No Data Available
          </h2>
          <p className="text-gray-500">No device data was found to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen mt-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Device Data</h2>

        {/* Category Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-gray-200">
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-md font-semibold transition-all
                ${
                  activeCategory === category
                    ? "border bg-oves-blue text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Data Display */}
        <div className="space-y-6">
          {categorizedData[activeCategory].length > 0 ? (
            categorizedData[activeCategory].map((serviceData, index) => (
              <ServiceCard
                key={`${serviceData.uuid}-${index}`}
                serviceData={serviceData}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No data available for this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceDataPage;
