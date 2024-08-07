import React, { useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import '../../components/DeviceDetails/DataDisplay.css';

const BleButtons = ({
  startBleScan,
  stopBleScan,
  toastMsg,
  isScanning,
  connectToBluetoothDevice,
  initBleData,
  detectedDevices,
  initBleDataResponse,
}) => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Detected Devices in BleButtons component:", detectedDevices);
  }, [detectedDevices]);

  useEffect(() => {
    console.log("isScanning state changed:", isScanning);
  }, [isScanning]);

  useEffect(() => {
    console.log("BleButtons component rendered");
  });

  const handleStartScanClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Start BLE Scan button clicked");
    startBleScan();
  };

  const handleStopScanClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Stop BLE Scan button clicked");
    stopBleScan();
  };

  const handleConnectClick = (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Connect to Bluetooth device clicked", macAddress);
    connectToBluetoothDevice(macAddress);
  };

  const handleInitBleDataClick = async (e, macAddress) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Initialize BLE data clicked", macAddress);

    try {
      const response = await initBleData(macAddress);
      console.log("BLE Data Initialization Response:", response);

      // Check if the response contains the expected data structure
      if (response && response.dataList) {
        dispatch({ type: 'SET_INIT_BLE_DATA_RESPONSE', payload: response });
      } else {
        console.error("Invalid response format:", response);
      }
    } catch (error) {
      console.error("Error during BLE Data Initialization:", error);
    }
  };

  const navigateToPage = (page) => {
    if (initBleDataResponse && initBleDataResponse.dataList) {
      console.log("Navigating to page:", page, "with data:", initBleDataResponse.dataList);
      navigate(page, { state: { data: initBleDataResponse.dataList } });
    } else {
      console.error("Initialization data is not available. Cannot navigate.");
    }
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <button
        onClick={handleStartScanClick}
        className={`px-4 py-2 rounded-md text-white ${
          isScanning ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
        } transition-colors duration-200`}
        disabled={isScanning}
      >
        {isScanning ? "Scanning..." : "Start BLE Scan"}
      </button>
      <button
        onClick={handleStopScanClick}
        className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
        disabled={!isScanning}
      >
        Stop BLE Scan
      </button>
      <button
        className="w-48 h-12 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
        onClick={toastMsg}
      >
        Show Toast Message
      </button>

      <div className="mt-4 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Detected Bluetooth Devices</h3>
        <div className="space-y-4">
          {detectedDevices && detectedDevices.length > 0 ? (
            detectedDevices.map((device, index) => (
              <div
                key={index}
                className="flex flex-col justify-between items-center p-4 bg-white shadow-md rounded-lg border border-gray-300"
              >
                <div>
                  <p className="font-semibold">{device.name || "Unnamed Device"}</p>
                  <p>MAC Address: {device.macAddress}</p>
                  <p>Rssi Number: {device.rssi}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={(e) => handleConnectClick(e, device.macAddress)}
                    className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
                  >
                    Connect
                  </button>
                  <button
                    onClick={(e) => handleInitBleDataClick(e, device.macAddress)}
                    className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                  >
                    Init BLE Data
                  </button>
                </div>
                {initBleDataResponse && initBleDataResponse.macAddress === device.macAddress && (
                  <div className="mt-2">
                    <div className="tabs">
                      <button onClick={() => navigateToPage('/att')}>ATT</button>
                      <button onClick={() => navigateToPage('/cmd')}>CMD</button>
                      <button onClick={() => navigateToPage('/sts')}>STS</button>
                      <button onClick={() => navigateToPage('/dta')}>DTA</button>
                      <button onClick={() => navigateToPage('/dia')}>DIA</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No devices detected</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BleButtons;
