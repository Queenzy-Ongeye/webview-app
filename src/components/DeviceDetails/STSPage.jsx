import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  AiOutlineCheckCircle,
  AiOutlineLoading3Quarters,
} from "react-icons/ai";
import client from "../../mqttClient";


const StsPage = () => {
  const location = useLocation();
  const { data } = location.state || {};

  useEffect(() => {
    if (data && data.length > 0) {
      const payload = JSON.stringify(data); // Convert the data to a JSON string

      // Publish the data to the 'device/sts' topic
      client.publish("device/sts", payload, { qos: 1 }, (err) => {
        if (err) {
          console.error("Failed to publish STS data to MQTT:", err);
        } else {
          console.log("STS data successfully published to MQTT:", payload);
        }
      });
    }
  }, [data]); // This effect will run when 'data' changes

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">STS Page</h2>
      {data && data.length > 0 ? (
        data.map((item, index) => (
          <div key={index} className="mb-4 p-4 border rounded shadow">
            {Object.keys(item.characterMap).map((uuid) => (
              <div key={uuid} className="mb-4">
                <h3 className="text-lg font-semibold">UUID: {uuid}</h3>
                <p>
                  <strong>Description:</strong> {item.characterMap[uuid].desc}
                </p>
                <p>
                  <strong>Name:</strong> {item.characterMap[uuid].name}
                </p>
                <p>
                  <strong>Service UUID:</strong>{" "}
                  {item.characterMap[uuid].serviceUuid}
                </p>
                <p>
                  <strong>Properties:</strong>{" "}
                  {item.characterMap[uuid].properties}
                </p>
                <p>
                  <strong>Enable Indicate:</strong>{" "}
                  {item.characterMap[uuid].enableIndicate ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Enable Notify:</strong>{" "}
                  {item.characterMap[uuid].enableNotify ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Enable Read:</strong>{" "}
                  {item.characterMap[uuid].enableRead ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Enable Write:</strong>{" "}
                  {item.characterMap[uuid].enableWrite ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Enable Write No Response:</strong>{" "}
                  {item.characterMap[uuid].enableWriteNoResp ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Real Value:</strong> {item.characterMap[uuid].realVal}
                </p>
                <div className="ml-4 mt-2">
                  <strong>Desc Map:</strong>
                  {Object.keys(item.characterMap[uuid].descMap).map(
                    (descKey) => (
                      <div key={descKey} className="ml-4 mt-2">
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
        ))
      ) : (
        <p>No data available</p>
      )}

      {state.data && state.data.STS ? (
        <button
          onClick={handlePublishClick}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-200 flex items-center"
        >
          {isPublishing ? (
            <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 mr-2" />
          ) : publishSuccess ? (
            <AiOutlineCheckCircle className="h-5 w-5 mr-2" />
          ) : null}
          {isPublishing
            ? "Publishing..."
            : publishSuccess
            ? "Published!"
            : "Publish Data to MQTT"}
        </button>
      ) : (
        <p className="text-red-500">No STS data available to publish</p>
      )}
    </div>
  );
};

export default StsPage;
