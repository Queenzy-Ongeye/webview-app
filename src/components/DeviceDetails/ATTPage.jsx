import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createMqttConnection } from "../../server/mqttClient";
import {
  connectMqtt,
  publishMqttMessage,
} from "../../service/javascriptBridge";

const ATTPage = () => {
  const location = useLocation();
  const { data } = location.state || {};

  // Fucntion for publishing to MQTT
  const publishMqttMessage = (topic) => {
    if (window.WebViewJavascriptBridge) {
      if (!data || data.length === 0) {
        console.error("No BLE data available to publish.");
        return;
      }

      const publishData = {
        topic: topic,
        qos: 0, // Quality of Service level
        content: JSON.stringify(data), // Publish BLE data as content
      };
      window.WebViewJavascriptBridge.callHandler(
        "mqttPublishMsg",
        publishData,
        (responseData) => {
          console.log("Message published to MQTT topic:", responseData);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">ATT Data</h2>
      {data && data.length > 0 ? (
        data.map((item, index) => (
          <div key={index} className="mb-6 p-6 bg-gray-50 shadow rounded-lg">
            {Object.keys(item.characterMap).map((uuid) => (
              <div key={uuid} className="mb-4 p-4 border-b last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-800">
                  {item.characterMap[uuid].desc}
                </h3>

                <table className="w-full text-left mt-4 border border-gray-200">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Description
                      </td>
                      <td className="p-2">{item.characterMap[uuid].desc}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">Name</td>
                      <td className="p-2">{item.characterMap[uuid].name}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Service UUID
                      </td>
                      <td className="p-2">
                        {item.characterMap[uuid].serviceUuid}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Properties
                      </td>
                      <td className="p-2">
                        {item.characterMap[uuid].properties}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Enable Indicate
                      </td>
                      <td className="p-2">
                        {item.characterMap[uuid].enableIndicate ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Enable Notify
                      </td>
                      <td className="p-2">
                        {item.characterMap[uuid].enableNotify ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Enable Read
                      </td>
                      <td className="p-2">
                        {item.characterMap[uuid].enableRead ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Enable Write
                      </td>
                      <td className="p-2">
                        {item.characterMap[uuid].enableWrite ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Enable Write No Response
                      </td>
                      <td className="p-2">
                        {item.characterMap[uuid].enableWriteNoResp
                          ? "Yes"
                          : "No"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-600">
                        Real Value
                      </td>
                      <td className="p-2">{item.characterMap[uuid].realVal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>No data available</p>
      )}
      <div className="mqtt-controls my-4 mx-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          className="py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-300"
          onClick={connectMqtt}
        >
          Connect to MQTT
        </button>
        <button
          className="py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-300"
          onClick={() => publishMqttMessage("emit/content/bleData/ata")}
        >
          Publish BLE Init Data
        </button>
      </div>
    </div>
  );
};

export default ATTPage;
