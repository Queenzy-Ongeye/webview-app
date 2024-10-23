import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connectMqtt } from "../../service/javascriptBridge";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../../service/store";

const BlePage = () => {
  const { state } = useStore();
  const location = useLocation();

  // Extract macAddress and device from the location state
  const { macAddress, device } = location.state || {};

  // Check for initBleDataResponse from global store (or fallback value)
  const initBleDataResponse = state.initBleDataResponse || {};

  const navigate = useNavigate();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Debugging: log out important variables to ensure they're defined
  console.log("Location State:", location.state);
  console.log("macAddress:", macAddress);
  console.log("device:", device);
  console.log("initBleDataResponse:", initBleDataResponse);

  const navigateToPage = (page, serviceNameEnum) => {
    // Filter the data based on the serviceNameEnum
    const filteredData = initBleDataResponse?.dataList?.filter(
      (item) => item.serviceNameEnum === serviceNameEnum
    );

    // Check if filteredData exists and has at least one item
    if (filteredData && filteredData.length > 0) {
      navigate(page, { state: { data: filteredData } });
    } else {
      // If no data is available, display a toast notification
      toast.error("No matching BLE data available for this service.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  // MQTT Connection
  const handleMqttConnection = () => {
    connectMqtt();
    setIsButtonDisabled(true);
  };

  return (
    <div className="p-4">
      {/* Always show this to avoid blank page */}
      <h1 className="text-xl">Bluetooth Device Management</h1>

      {/* Only display buttons if initBleDataResponse and device.macAddress are valid */}
      {initBleDataResponse?.macAddress && initBleDataResponse.macAddress === device?.macAddress ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          <button
            onClick={() => navigateToPage("/att", "ATT_SERVICE_NAME")}
            className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-700 hover:shadow-md transition duration-200"
          >
            ATT
          </button>
          <button
            onClick={() => navigateToPage("/cmd", "CMD_SERVICE_NAME")}
            className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-700 hover:shadow-md transition duration-200"
          >
            CMD
          </button>
          <button
            onClick={() => navigateToPage("/sts", "STS_SERVICE_NAME")}
            className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-700 hover:shadow-md transition duration-200"
          >
            STS
          </button>
          <button
            onClick={() => navigateToPage("/dta", "DTA_SERVICE_NAME")}
            className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-700 hover:shadow-md transition duration-200"
          >
            DTA
          </button>
          <button
            onClick={() => navigateToPage("/dia", "DIA_SERVICE_NAME")}
            className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:shadow-md transition duration-200"
          >
            DIA
          </button>
          <button
            className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:shadow-md transition duration-200"
            onClick={handleMqttConnection}
            disabled={isButtonDisabled}
          >
            Connect to MQTT
          </button>
        </div>
      ) : (
        <p className="text-red-500 mt-4">No matching data available or macAddress mismatch.</p>
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default BlePage;