import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connectMqtt } from "../../service/javascriptBridge";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../../service/store";

const BlePage = () => {
  const { state } =useStore();
  // Use useLocation to access the state (macAddress) from the navigation
  const location = useLocation();
  const { macAddress, device } = location.state || {}; // Extract macAddress from location.state
  const initBleDataResponse = state.initBleDataResponse
  const navigate = useNavigate();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Debugging log
  console.log("Location State:", location.state);
  console.log("macAddress:", macAddress);
  console.log("initBleDataResponse:", initBleDataResponse);

  const navigateToPage = (page, serviceNameEnum) => {
    const filteredData = initBleDataResponse?.dataList?.filter(
      (item) => item.serviceNameEnum === serviceNameEnum
    );
    navigate(page, { state: { data: filteredData } });
  };

  // MQTT Connection
  const handleMqttConnection = () => {
    connectMqtt();
    setIsButtonDisabled(true);
  };

  return (
    <div className="p-4">
      {/* Display ATT, CMD, etc. Buttons after Initialization */}
      {initBleDataResponse && initBleDataResponse.macAddress === device.macAddress && (
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
            className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-700 hover:shadow-md transition duration-200"
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
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default BlePage;
