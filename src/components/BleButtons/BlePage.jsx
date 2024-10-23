import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connectMqtt } from "../../service/javascriptBridge";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../../service/store";

const BlePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ATT_SERVICE_NAME");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  
  const { initBleDataResponse, macAddress } = location.state || {};

  const navigateToPage = (page, serviceNameEnum) => {
    const filteredData = initBleDataResponse?.dataList?.filter(
      (item) => item.serviceNameEnum === serviceNameEnum
    );
    setActiveTab(serviceNameEnum);
    navigate(page, { state: { data: filteredData } });
  };

  const handleMqttConnection = () => {
    connectMqtt();
    setIsButtonDisabled(true);
  };

  const services = [
    { name: "ATT", route: "/att", enum: "ATT_SERVICE_NAME" },
    { name: "CMD", route: "/cmd", enum: "CMD_SERVICE_NAME" },
    { name: "STS", route: "/sts", enum: "STS_SERVICE_NAME" },
    { name: "DTA", route: "/dta", enum: "DTA_SERVICE_NAME" },
    { name: "DIA", route: "/dia", enum: "DIA_SERVICE_NAME" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Available Services</h2>
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          {services.map((service) => (
            <button
              key={service.name}
              onClick={() => navigateToPage(service.route, service.enum)}
              className={`px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200 ${
                activeTab === service.enum ? "bg-gray-200 text-blue-500" : ""
              }`}
            >
              {service.name}
            </button>
          ))}
        </div>
        <div className="text-center">
          <button
            className="px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
            onClick={handleMqttConnection}
            disabled={isButtonDisabled}
          >
            Connect to MQTT
          </button>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default BlePage;