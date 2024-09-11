import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createMqttConnection } from "../../server/mqttClient";

const STSPage = ({ mqttData, initialData }) => {
  const location = useLocation();
  const { data } = location.state || {};

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const payload = JSON.stringify(data); // Convert the data to a JSON string
      console.log("Data is here: ", payload);

      // Publish the data to the 'device/sts' topic
      const mqttClient = createMqttConnection();
      console.log("mqtt client is here: ", mqttClient);
      // Wait for the client to be connected before publishing
      mqttClient.on("connect", () => {
        console.log("MQTT client connected. Ready to publish.");

        mqttClient.publish(
          "emit/content/bleData/sts",
          payload,
          { qos: 1 },
          (err) => {
            if (err) {
              console.error("Failed to publish STS data to MQTT:", err);
            } else {
              console.log("STS data successfully published to MQTT:", payload);
            }
          }
        );
      });

      mqtt.on("error", (error) => {
        console.error("Failed to connect: ", error.message);
      });
      mqttClient.on("offline", () => {
        console.log("MQTT client is offline.");
      });
    }
  }, [data]);

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
    </div>
  );
};

export async function getServerSideProps(context) {
  const client = createMqttConnection(); // Create server-side MQTT connection

  let mqttData = [];
  let initialData = context.query; // Fetch initial data from the URL or query

  if (client) {
    // Ensure the client is connected before subscribing
    client.on("connect", () => {
      console.log("Server-side MQTT client connected.");

      // Subscribe to the desired topic
      client.subscribe("emit/content/bleData/sts", (err) => {
        if (err) {
          console.error("Failed to subscribe to MQTT topic:", err);
        } else {
          console.log("Subscribed to MQTT topic on server.");
        }
      });

      // Handle incoming messages and simulate waiting for them
      client.on("message", (topic, message) => {
        mqttData.push(JSON.parse(message.toString()));
        console.log("Received MQTT message on server:", message.toString());
      });
    });

    // Wait to collect messages (simulate delay)
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } else {
    console.error("MQTT client not initialized on server.");
  }

  // Return MQTT data and initial input data as props to the component
  return {
    props: {
      mqttData,
      initialData,
    },
  };
}

export default STSPage;
