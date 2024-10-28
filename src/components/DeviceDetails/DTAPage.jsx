import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, Bounce, ToastContainer } from "react-toastify";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const DTAPage = () => {
  const location = useLocation();
  const { data } = location.state || {};
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function for publishing to MQTT
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
        DTA Data
      </h2>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 py-2 px-4 bg-cyan-800 text-white font-semibold rounded-lg shadow-md transition duration-300"
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
                    {Object.entries(item.characterMap[uuid]).map(
                      ([key, value]) => (
                        <tr key={key} className="border-b">
                          <td className="p-3 font-semibold text-gray-600 capitalize">
                            {key}
                          </td>
                          <td className="p-3">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : value.toString()}
                          </td>
                        </tr>
                      )
                    )}
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
          onClick={() => publishMqttMessage("emit/content/bleData/DTA")}
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

export default DTAPage;
