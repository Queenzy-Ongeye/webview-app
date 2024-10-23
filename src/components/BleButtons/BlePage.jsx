import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BlePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { macAddress, initBleDataResponse } = location.state || {}; // Get the data passed from BleButtons

  const navigateToPage = async (page, dataFile) => {
    try {
      const data = await import(`./components/DeviceDetails/${dataFile}`); // Dynamically import the data
      navigate(page, { state: { data: data.default || data } });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  if (!macAddress || !initBleDataResponse) {
    return <p>No data available. Please initialize a device first.</p>;
  }

  return (
    <div className="accordion-page-container">
      <h2>Bluetooth Device: {macAddress}</h2>
      <div className="accordion-section">
        <button
          onClick={() => navigateToPage("/att", "ATTPage")}
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
        >
          ATT
        </button>
        <button
          onClick={() => navigateToPage("/cmd", "CMDPage")}
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
        >
          CMD
        </button>
        <button
          onClick={() => navigateToPage("/sts", "STSPage")}
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
        >
          STS
        </button>
        <button
          onClick={() => navigateToPage("/dta", "DTAPage")}
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
        >
          DTA
        </button>
        <button
          onClick={() => navigateToPage("/dia", "diaData")}
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition duration-200"
        >
          DIA
        </button>
      </div>
    </div>
  );
};

export default BlePage;
