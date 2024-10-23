import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ATTPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Debug log when component mounts
  useEffect(() => {
    console.log("ATTPage Location State:", location.state);
  }, [location.state]);

  const { data, macAddress, serviceNameEnum } = location.state || {};

  // Verify data on component mount
  useEffect(() => {
    if (!location.state) {
      console.error("No state provided to ATTPage");
      toast.error("No data provided. Redirecting to services page...");
      navigate("/services");
      return;
    }

    if (!data || !Array.isArray(data)) {
      console.error("Invalid ATT data format:", data);
      toast.error("Invalid data format received");
      return;
    }

    if (data.length === 0) {
      console.log("Empty ATT data array received");
      toast.warning("No ATT data available for this device");
      return;
    }

    // Verify we're looking at ATT data
    if (serviceNameEnum !== "ATT_SERVICE_NAME") {
      console.error("Wrong service type received:", serviceNameEnum);
      toast.error("Incorrect service type data received");
      return;
    }

    // Log the structure of the first data item
    if (data[0]) {
      console.log("First ATT data item structure:", data[0]);
    }
  }, [data, serviceNameEnum, navigate, location.state]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">
        ATT Data
      </h2>
      
      {macAddress && (
        <div className="mb-4 text-center text-gray-600">
          MAC Address: {macAddress}
        </div>
      )}

      {/* Debug Info Panel */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold">Debug Info:</h3>
        <p>Data Available: {data ? 'Yes' : 'No'}</p>
        <p>Data Length: {data ? data.length : 0}</p>
        <p>Service Type: {serviceNameEnum || 'Not specified'}</p>
      </div>

      {/* Rest of the ATTPage component code ... */}
    </div>
  );
};