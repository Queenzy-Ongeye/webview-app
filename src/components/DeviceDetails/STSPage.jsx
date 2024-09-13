import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createMqttConnection } from "../../server/mqttClient";
import { useStore } from "../../service/store";

const STSPage = () => {
  const location = useLocation();
  const { data } = location.state || {};
  const {state} = useStore();

  useEffect(() => {
    const connectWebViewJavascriptBridge = (callback) => {
      if (window.WebViewJavascriptBridge) {
        callback(window.WebViewJavascriptBridge);
      } else {
        document.addEventListener(
          "WebViewJavascriptBridgeReady",
          () => {
            callback(window.WebViewJavascriptBridge);
          },
          false
        );
      }
    };

    const setupBridge = (bridge) => {
      // Register the handlers for MQTT events
      bridge.registerHandler("connectMqttCallBack", (data, responseCallback) => {
        console.info("MQTT Connect Callback Data:", data);
        responseCallback(data);
      });

      bridge.registerHandler("mqttMsgArrivedCallBack", (data, responseCallback) => {
        console.info("MQTT Message Arrived:", data);
        // Optionally, handle the MQTT message
        responseCallback(data);
      });
    };

    connectWebViewJavascriptBridge(setupBridge);
  }, []);

  const mqttSubTopic = () => {
    if (state.mqttClient) {
      state.mqttClient.subscribe("/a/b/c", { qos: 0 }, (err) => {
        if (err) {
          console.error("Failed to subscribe:", err);
        } else {
          console.log("Subscribed to topic /a/b/c");
        }
      });
    }
  };

  const mqttUnSubTopic = () => {
    if (state.mqttClient) {
      state.mqttClient.unsubscribe("/a/b/c", (err) => {
        if (err) {
          console.error("Failed to unsubscribe:", err);
        } else {
          console.log("Unsubscribed from topic /a/b/c");
        }
      });
    }
  };

  const mqttPublishMsg = () => {
    const payload = JSON.stringify(data);
    if (state.mqttClient) {
      state.mqttClient.publish("emit/content/bleData/sts", payload, { qos: 0 }, (err) => {
        if (err) {
          console.error("Failed to publish message:", err);
        } else {
          console.log("Message published:", payload);
        }
      });
    }
  };

  // useEffect(() => {
  //   if (data && Object.keys(data).length > 0) {
  //     const payload = JSON.stringify(data); // Convert the data to a JSON string
  //     console.log("Data is here: ", payload);

  //     // Publish the data to the 'device/sts' topic
  //     const mqttClient = createMqttConnection();
  //     console.log("mqtt client is here: ", mqttClient);
  //     // Wait for the client to be connected before publishing
  //     mqttClient.on("connect", () => {
  //       console.log("MQTT client connected. Ready to publish.");

  //       mqttClient.publish(
  //         "emit/content/bleData/sts", {qos:1},
  //         payload,
  //         { qos: 1 },
  //         (err) => {
  //           if (err) {
  //             console.error("Failed to publish STS data to MQTT:", err);
  //           } else {
  //             console.log("STS data successfully published to MQTT:", payload);
  //           }
  //         }
  //       );
  //     });

  //     mqttClient.on("error", (error) => {
  //       console.error("Failed to connect: ", error.message);
  //     });
  //     mqttClient.on("offline", () => {
  //       console.log("MQTT client is offline.");
  //     });
  //   }
  // }, [data]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Status Data</h2>
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
      <button
        className="bg-black rounded-md text-white"
        onClick={mqttPublishMsg}
      >
        Publish Message
      </button>
    </div>
  );
};

export default STSPage;
