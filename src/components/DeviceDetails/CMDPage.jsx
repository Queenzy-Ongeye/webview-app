import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "../../service/store";
import mqtt from "mqtt"

const CMDPage = () => {
  const location = useLocation();
  const { data } = location.state || {};

  const { state, dispatch } = useStore();

  console.log("Full Data object:", data);

  // Find the correct object in dataList
  let cmdData = null;
  if (data) {
    const cmdServiceObject = data.find(
      (item) => item.serviceNameEnum === "CMD_SERVICE_NAME"
    );
    if (cmdServiceObject) {
      // Now, find the specific data within the characterMap
      cmdData = cmdServiceObject.characterMap;
      console.log("CMD Data found:", cmdData);
    }
  }

  const handleSendCMDData = () => {
    let client = state.mqttClient;
    if (!client) {
      console.error("MQTT client is not initialized");
      return;
    }
  
    console.log("MQTT Client Connected:", client.connected);
  
    if (client.connected) {
      publishCMD(client);
    } else {
      console.error("MQTT client is not connected");
    }
  };

  const publishCMD = (client) => {
    if (cmdData) {
      const topic = "emit/bleData/cmd/";
      const message = JSON.stringify(cmdData);
      // Publish the CMD data to MQTT
      client.publish(topic, message, { qos: 1 }, (err) => {
        if (err) {
          console.error("Failed to publish CMD message:", err.message);
        } else {
          console.log(
            `CMD data "${message}" successfully published to topic "${topic}"`
          );
        }
      });
    } else {
      console.error("No CMD data available to send");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">CMD Page</h2>
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

      <button onClick={handleSendCMDData} className="btn-send-dta">
        Send CMD Data
      </button>
    </div>
  );
};

export default CMDPage;