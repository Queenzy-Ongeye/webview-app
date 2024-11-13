import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, Bounce, ToastContainer } from "react-toastify";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaArrowLeft } from "react-icons/fa"; // Import arrow icon
import "react-toastify/dist/ReactToastify.css";

const CMDPage = () => {
  const location = useLocation();
  const { data } = location.state || {};
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const publishMqttMessage = (topic) => {
    if (window.WebViewJavascriptBridge) {
      if (!data || data.length === 0) {
        toast.error("No BLE data available to publish.", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
        return;
      }

      const publishData = {
        topic,
        qos: 0,
        content: JSON.stringify(data),
      };

      setLoading(true);
      window.WebViewJavascriptBridge.callHandler(
        "mqttPublishMsg",
        publishData,
        () => {
          setLoading(false);
          toast.success("Message published successfully", {
            position: "top-right",
            autoClose: 5000,
            theme: "colored",
            transition: Bounce,
          });
        }
      );
    } else {
      toast.error("Error: WebViewJavascriptBridge is not initialized.", {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto bg-gray-50 rounded-xl shadow-md mt-4 sm:mt-6">
      <div className="flex items-center justify-between mb-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-xl sm:text-2xl text-oves-blue flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 border border-oves-blue transition-all"
        >
          <FaArrowLeft />
        </button>

        {/* Publish Button */}
        <button
          className={`py-2 px-4 text-sm sm:text-base font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-oves-blue"
          } text-white`}
          onClick={() => publishMqttMessage("emit/content/bleData/cmd")}
          disabled={loading}
        >
          {loading ? (
            <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 mr-2" />
          ) : (
            "Publish"
          )}
          {loading && "Publishing..."}
        </button>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-black">
        CMD Data
      </h2>

      {data && data.length > 0 ? (
        data.map((item, index) => (
          <div
            key={index}
            className="mb-6 p-4 sm:p-6 bg-white shadow-md rounded-lg"
          >
            {Object.keys(item.characterMap).map((uuid) => (
              <div key={uuid} className="mb-3 p-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {item.characterMap[uuid].desc}
                </h3>

                <table className="w-full text-left border border-gray-200 rounded-lg">
                  <tbody>
                    <tr className="border-b bg-gray-50">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Name
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].name}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Service UUID
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].serviceUuid}
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Properties
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].properties}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Enable Indicate
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].enableIndicate ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Enable Notify
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].enableNotify ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Enable Read
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].enableRead ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Enable Write
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].enableWrite ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Enable Write No Response
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].enableWriteNoResp
                          ? "Yes"
                          : "No"}
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-2 sm:p-3 font-semibold text-gray-600">
                        Real Value
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.characterMap[uuid].realVal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 italic">No data available</p>
      )}

      <ToastContainer />
    </div>
  );
};

export default CMDPage;
