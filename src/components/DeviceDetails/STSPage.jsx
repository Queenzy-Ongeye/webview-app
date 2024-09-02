// src/components/DeviceDetails/STSPage.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import mqttClient from '../../mqttClient';

const STSPage = () => {
  const { state } = useLocation(); // Get data from state
  const initBleDataResponse = state?.data || []; // Access dataList passed from BleButtons
  const [selectedData, setSelectedData] = useState([]);

  const handleCheckboxChange = (item) => {
    setSelectedData((prevSelectedData) => {
      if (prevSelectedData.includes(item)) {
        return prevSelectedData.filter((data) => data !== item);
      } else {
        return [...prevSelectedData, item];
      }
    });
  };

  const handleSendSelectedData = () => {
    if (selectedData.length > 0) {
      mqttClient.publish('device/sts', JSON.stringify(selectedData), { qos: 1 }, (err) => {
        if (err) {
          console.error('Failed to publish selected STS data to device/sts:', err);
        } else {
          console.log('Selected STS data published to device/sts:', selectedData);
        }
      });
    } else {
      console.log('No data selected for sending.');
    }
  };

  return (
    <div>
      <h1>STS Data</h1>
      {initBleDataResponse.length > 0 ? (
        <form>
          {initBleDataResponse.map((item, index) => (
            <div key={index}>
              <label>
                <input
                  type="checkbox"
                  value={JSON.stringify(item)}
                  onChange={() => handleCheckboxChange(item)}
                />
                {JSON.stringify(item)}
              </label>
            </div>
          ))}
          <button type="button" onClick={handleSendSelectedData}>
            Send Selected Data
          </button>
        </form>
      ) : (
        <p>No STS data available.</p>
      )}
    </div>
  );
};

export default STSPage;
