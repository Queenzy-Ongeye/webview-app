import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";

const StsPage = () => {
  const { state } = useStore();
  const [selectedData, setSelectedData] = useState({});

  // Function to handle checkbox changes
  const handleCheckboxChange = (uuid) => {
    setSelectedData((prevState) => ({
      ...prevState,
      [uuid]: !prevState[uuid],
    }));
  };

  // Function to handle the form submission and send data to MQTT
  const handleSubmit = () => {
    const client = state.mqttClient;
    if (client) {
      Object.keys(selectedData).forEach((uuid) => {
        if (selectedData[uuid]) {
          const dataToSend = state.initBleData.STS[uuid]; // Adjust according to your actual data structure
          client.publish(
            "devices/sts",
            JSON.stringify({ uuid, data: dataToSend }),
            (err) => {
              if (err) {
                console.error(
                  `Failed to publish message for UUID ${uuid}:`,
                  err
                );
              } else {
                console.log(
                  `Message for UUID ${uuid} successfully published to MQTT`
                );
              }
            }
          );
        }
      });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">STS Data</h2>
      <form>
        {state.initBleData && state.initBleData.STS ? (
          Object.keys(state.initBleData.STS).map((uuid, index) => (
            <div key={index} className="mb-4 p-4 border rounded shadow">
              <label>
                <input
                  type="checkbox"
                  checked={!!selectedData[uuid]}
                  onChange={() => handleCheckboxChange(uuid)}
                />
                <span className="ml-2 font-semibold">UUID: {uuid}</span>
              </label>
              <div className="ml-4 mt-2">
                <p>
                  <strong>Description:</strong>{" "}
                  {state.initBleData.STS[uuid].desc}
                </p>
                <p>
                  <strong>Name:</strong> {state.initBleData.STS[uuid].name}
                </p>
                <p>
                  <strong>Service UUID:</strong>{" "}
                  {state.initBleData.STS[uuid].serviceUuid}
                </p>
                <p>
                  <strong>Properties:</strong>{" "}
                  {state.initBleData.STS[uuid].properties}
                </p>
                <p>
                  <strong>Real Value:</strong>{" "}
                  {state.initBleData.STS[uuid].realVal}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No STS data available</p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send Selected Data to MQTT
        </button>
      </form>
    </div>
  );
};

export default StsPage;
