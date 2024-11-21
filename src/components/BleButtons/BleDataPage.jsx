import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Badge, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { useStore } from '../../service/store';

const BleDataPage = () => {
  // Simulating location state with useState for demonstration
  const {state} = useStore();
  const location = useLocation();
  const deviceData = location.state || state.initBleData.dataList || []; // Fallback to global state

  useEffect(() => {
    console.log("Received data in BleDataPage:", deviceData);
  }, [deviceData])

  const [activeCategory, setActiveCategory] = useState("ATT");

  // Categorize data
  const categorizedData = useMemo(() => {
    const categories = {
      ATT: [],
      DTA: [],
      DIA: [],
      CMD: [],
      STS: [],
    };

    if (Array.isArray(deviceData)) {
      deviceData.forEach((serviceData) => {
        if (serviceData && serviceData.serviceNameEnum) {
          const category = serviceData.serviceNameEnum.split("_")[0];
          if (categories[category]) {
            categories[category].push(serviceData);
          }
        }
      });
    }

    return categories;
  }, [deviceData]);

  // Determine available categories
  const availableCategories = Object.keys(categorizedData).filter(
    (category) => categorizedData[category].length > 0
  );

  // Characteristic Card Component
  const CharacteristicCard = ({ characteristic, uuid }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!characteristic) return null;

    return (
      <div className="bg-white border rounded-lg p-4 mt-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-primary">
            {characteristic.name || "Unnamed Characteristic"}
          </h3>
          <Badge className="text-xs">{uuid}</Badge>
        </div>

        <div className="space-y-2">
          {characteristic.desc && (
            <p className="text-sm text-gray-600">{characteristic.desc}</p>
          )}

          {characteristic.realVal !== undefined && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Value:</span>
              <code className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                {String(characteristic.realVal)}
              </code>
            </div>
          )}

          {characteristic.properties && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Properties:</span>
              <span className="text-sm">{characteristic.properties}</span>
            </div>
          )}

          {characteristic.descMap && Object.keys(characteristic.descMap).length > 0 && (
            <div>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center text-sm font-medium text-blue-500 hover:underline"
              >
                {isExpanded ? <ChevronUp className="mr-1" /> : <ChevronDown className="mr-1" />}
                {isExpanded ? "Hide" : "Show"} Descriptors
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-auto max-h-32 bg-gray-50 p-2 rounded-md mt-2"
                  >
                    {Object.entries(characteristic.descMap).map(
                      ([descUuid, descItem]) => (
                        <div 
                          key={descUuid} 
                          className="flex justify-between items-center mb-1"
                        >
                          <code className="text-xs text-gray-500">{descUuid}</code>
                          <span className="text-sm">{descItem.desc}</span>
                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Service Card Component
  const ServiceCard = ({ serviceData }) => {
    if (!serviceData) return null;

    return (
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold">
            {serviceData.serviceNameEnum 
              ? serviceData.serviceNameEnum.replace(/_/g, " ") 
              : "Unnamed Service"}
          </h2>
          <Badge className="text-xs">{serviceData.uuid}</Badge>
        </div>

        <div className="space-y-4">
          {serviceData.characterMap ? (
            Object.entries(serviceData.characterMap).map(
              ([uuid, characteristic]) => (
                <CharacteristicCard
                  key={uuid}
                  uuid={uuid}
                  characteristic={characteristic}
                />
              )
            )
          ) : (
            <p className="text-sm text-gray-500">No characteristics found</p>
          )}
        </div>
      </div>
    );
  };

  // No data available state
  if (!deviceData || deviceData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
          <p className="text-gray-600">
            Please ensure you've connected to a device and retrieved data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Device Data</h1>

      {/* Category Tabs */}
      <div className="flex mb-6 space-x-2">
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeCategory === category
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Category Content */}
      <div className="space-y-6">
        {categorizedData[activeCategory].map((serviceData, index) => (
          <ServiceCard
            key={`${serviceData.uuid || 'unknown'}-${index}`}
            serviceData={serviceData}
          />
        ))}
      </div>

      {/* Info Button */}
      <button 
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        onClick={() => alert("Device data categories and their characteristics")}
      >
        <Info className="h-6 w-6" />
      </button>
    </div>
  );
};

export default BleDataPage;