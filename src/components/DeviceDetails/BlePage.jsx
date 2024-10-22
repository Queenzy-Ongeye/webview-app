import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCheckCircle } from "react-icons/fa"; // Success Icon
import { connectMqtt } from "../../service/javascriptBridge";
import { useStore } from "../../service/store";
import { useNavigate, useLocation } from "react-router-dom";

const BlePage = ({ initBleData, initBleDataResponse }) => {
  const [initializingMacAddress, setInitializingMacAddress] = useState(null);
  const [initSuccessMac, setInitSuccessMac] = useState(null); // Track successful initialization per MAC
  const [isLoading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const navigate = useNavigate();
  const { dispatch } = useStore();

  // Use useLocation to access the state (macAddress) from the navigation
  const location = useLocation();
  const { macAddress } = location.state || {}; // Extract macAddress from location.state

  const navigateToPage = (page, serviceNameEnum) => {
    const filteredData = initBleDataResponse?.dataList.filter(
      (item) => item.serviceNameEnum === serviceNameEnum
    );
    navigate(page, { state: { data: filteredData } });
  };

  // MQTT Connection
  const handleMqttConnection = () => {
    connectMqtt();
    setIsButtonDisabled(true);
  };

  const handleInitBleDataClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setInitializingMacAddress(macAddress);
    setLoading(true);

    try {
      const response = await initBleData(macAddress);
      dispatch({ type: "SET_INIT_BLE_DATA", payload: response });

      // If the initialization is successful, set the success state for the current MAC
      setTimeout(() => {
        setInitSuccessMac(macAddress);
        setTimeout(() => setInitSuccessMac(null), 10000); // Clear success state after 10 seconds
      }, 35000);
    } catch (error) {
      console.error("Error during BLE Data Initialization:", error);
      alert("Failed to initialize BLE data. Please try again.");

      setInitSuccessMac(null); // Ensure that the success state is not set in case of failure
    } finally {
      setTimeout(() => {
        setInitializingMacAddress(null);
        setLoading(false);
      }, 35000);
    }
  };

  return (
    <div className="p-4">
      {/* Display the MAC Address */}
      <h1 className="text-xl font-bold mb-4">
        Device MAC Address: {macAddress || "Unknown"}
      </h1>

      {/* Init BLE Data Button */}
      <div className="justify-between w-full mt-4 space-x-2">
        <button
          onClick={handleInitBleDataClick}
          className={`w-full px-4 py-2 border rounded-md font-semibold transition-all duration-300 ${
            initializingMacAddress === macAddress
              ? "bg-gray-500 text-white cursor-not-allowed animate-pulse"
              : initSuccessMac === macAddress
              ? "bg-green-500 text-white"
              : "bg-cyan-700 text-white hover:bg-cyan-600 hover:shadow-md"
          }`}
          disabled={isLoading || initializingMacAddress === macAddress}
        >
          {initializingMacAddress === macAddress
            ? "Initializing..."
            : initSuccessMac === macAddress
            ? "Initialized"
            : "Init BLE Data"}
        </button>
      </div>

      {/* Display ATT, CMD, etc. Buttons after Initialization */}
      {initBleDataResponse && initBleDataResponse.macAddress === macAddress && (
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
