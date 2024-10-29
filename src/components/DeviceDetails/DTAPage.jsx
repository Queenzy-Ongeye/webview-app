import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, Bounce, ToastContainer } from "react-toastify";
import { AiOutlineLoading3Quarters, AiOutlineArrowLeft,  } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs"; // Icon for info display

const DTAPage = () => {
  const location = useLocation();
  const { data } = location.state || {};
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      <div className="flex items-center space-x-3 mb-6">
        <AiOutlineArrowLeft
          onClick={() => navigate(-1)}
          className="text-2xl text-blue-600 cursor-pointer hover:text-blue-800 transition duration-200"
        />
        <h2 className="text-2xl font-bold text-blue-600">DTA Data</h2>
      </div>
      {data && data.length > 0 ? (
        data.map((item, index) => (
          <div
            key={index}
            className="mb-4 p-4 bg-white shadow-lg rounded-lg transition-transform transform hover:scale-105"
          >
            {Object.keys(item.characterMap).map((uuid) => (
              <div key={uuid} className="mb-4 border-b last:border-none p-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2 text-sm font-semibold uppercase text-gray-500">
                    <BsInfoCircle className="text-blue-500" />
                    <span>{item.characterMap[uuid].name || "N/A"}</span>
                  </div>
                  <div className="text-blue-500 cursor-pointer text-sm font-semibold hover:text-blue-700 transition duration-200">
                    READ
                  </div>
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  VALUE: {item.characterMap[uuid].realVal || "N/A"}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {item.characterMap[uuid].desc || "No description available"}
                </div>

                <table className="w-full text-left mt-3 border border-gray-200 rounded-lg overflow-hidden shadow">
                  <tbody>
                    {Object.entries(item.characterMap[uuid]).map(
                      ([key, value]) => (
                        <React.Fragment key={key}>
                          {key === "descMap" && typeof value === "object" ? (
                            Object.entries(value).map(([subKey, subValue]) => (
                              <tr
                                key={subKey}
                                className="border-b bg-gray-50 last:border-none"
                              >
                                <td className="p-2 font-semibold text-gray-700">
                                  {subKey}
                                </td>
                                <td className="p-2 text-gray-800">
                                  {subValue.toString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="border-b last:border-none">
                              <td className="p-2 font-semibold text-gray-700 bg-gray-50">
                                {key}
                              </td>
                              <td className="p-2 text-gray-800">
                                {value.toString()}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
