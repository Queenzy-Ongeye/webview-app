import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import mqttClient from "../../mqttClient";

const ATTPage = () => {
  const location = useLocation();
  const { data } = location.state || {};
  const [expandedSections, setExpandedSections] = useState({}); // Track expanded sections

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const payload = JSON.stringify(data); // Convert the data to a JSON string
      console.log("Data is here: ", payload);

      // Publish the data to the 'device/sts' topic
      mqttClient.publish(
        "emit/content/bleData/att",
        payload,
        { qos: 1 },
        (err) => {
          if (err) {
            console.error("Failed to publish ATT data to MQTT:", err);
          } else {
            console.log("ATT data successfully published to MQTT:", payload);
          }
        }
      );
    }
  }, [data]);

  // Toggle function to expand or collapse sections
  const toggleSection = (index) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">ATT Data</h2>
      {data && data.length > 0 ? (
        data.map((item, index) => (
          <div key={index} className="mb-6 p-6 bg-gray-50 shadow rounded-lg">
            <button
              className="w-full text-left text-xl font-semibold bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
              onClick={() => toggleSection(index)}
            >
              {expandedSections[index] ? "Hide Details" : "Show Details"} -
              Device {index + 1}
            </button>

            {expandedSections[index] && (
              <div className="mt-4">
                {Object.keys(item.characterMap).map((uuid) => (
                  <div key={uuid} className="mb-4 p-4 border-b last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-800">
                      UUID: {uuid}
                    </h3>

                    <table className="w-full text-left mt-4 border border-gray-200">
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-semibold text-gray-600">
                            Description
                          </td>
                          <td className="p-2">
                            {item.characterMap[uuid].desc}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-semibold text-gray-600">
                            Name
                          </td>
                          <td className="p-2">
                            {item.characterMap[uuid].name}
                          </td>
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
                            {item.characterMap[uuid].enableIndicate
                              ? "Yes"
                              : "No"}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-semibold text-gray-600">
                            Enable Notify
                          </td>
                          <td className="p-2">
                            {item.characterMap[uuid].enableNotify
                              ? "Yes"
                              : "No"}
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
                          <td className="p-2">
                            {item.characterMap[uuid].realVal}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="ml-4 mt-4">
                      <h4 className="font-semibold text-gray-700">Desc Map</h4>
                      {Object.keys(item.characterMap[uuid].descMap).map(
                        (descKey) => (
                          <div key={descKey} className="ml-2 mt-2">
                            <p>
                              <strong>UUID:</strong> {descKey}
                            </p>
                            <p>
                              <strong>Description:</strong>{" "}
                              {item.characterMap[uuid].descMap[descKey].desc}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default ATTPage;
