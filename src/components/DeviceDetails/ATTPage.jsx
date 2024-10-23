import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, Bounce, ToastContainer } from "react-toastify"; // Added Bounce for transition
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Import a loading icon

const ATTPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Destructure both data and macAddress from location state
  const { data, macAddress } = location.state || {};

  // Verify data on component mount
  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("Invalid or missing ATT data");
      toast.error("No ATT data available", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  }, [data]);

  const publishMqttMessage = (topic) => {
    if (window.WebViewJavascriptBridge) {
      if (!data || data.length === 0) {
        console.error("No BLE data available to publish.");
        toast.error("No BLE data available to publish.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      const publishData = {
        topic: topic,
        qos: 0,
        content: JSON.stringify(data),
      };

      setLoading(true);

      window.WebViewJavascriptBridge.callHandler(
        "mqttPublishMsg",
        publishData,
        (responseData) => {
          setLoading(false);
          toast.success("Message published successfully", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            transition: Bounce,
          });
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
      toast.error("Error: WebViewJavascriptBridge is not initialized.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">
        ATT Data
      </h2>
      
      {/* Display MAC Address */}
      {macAddress && (
        <div className="mb-4 text-center text-gray-600">
          MAC Address: {macAddress}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 py-2 px-4 bg-cyan-800 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-900 transition duration-300"
      >
        Back
      </button>

      {data && data.length > 0 ? (
        data.map((item, index) => (
          <div key={index} className="mb-6 p-6 bg-white shadow-lg rounded-lg">
            {Object.keys(item.characterMap).map((uuid) => (
              <div key={uuid} className="mb-4 p-4 border-b last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {item.characterMap[uuid].desc}
                </h3>

                <table className="w-full text-left mt-4 border border-gray-300 rounded-lg overflow-hidden">
                  <tbody>
                    <tr className="border-b bg-gray-50">
                      <td className="p-3 font-semibold text-gray-600">Name</td>
                      <td className="p-3">{item.characterMap[uuid].name}</td>
                    </tr>
                    {/* ... rest of the table rows ... */}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">No data available</p>
      )}

      <div className="mqtt-controls my-8 flex justify-center">
        <ToastContainer />
        <button
          className={`py-3 px-6 font-semibold rounded-lg shadow-md transition duration-300 flex justify-center items-center ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50`}
          onClick={() => publishMqttMessage("emit/content/bleData/att")}
          disabled={loading}
        >
          {loading ? (
            <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 mr-2" />
          ) : (
            "Publish BLE Init Data"
          )}
          {loading && "Publishing..."}
        </button>
      </div>
    </div>
  );
};

export default ATTPage;
