import React, { useState, useEffect } from "react";
import { useStore } from "../../service/store";
import { useNavigate } from "react-router-dom";
import { Wifi, WifiOff } from "lucide-react";

const BleButtons = () => {
  const { dispatch, state } = useStore();
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [error, setError] = useState(null);

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map();
  state.detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  const uniqueDevice = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  useEffect(() => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.registerHandler(
        "bleConnectSuccessCallBack",
        (data, responseCallback) => {
          const macAddress = data.macAddress;
          if (macAddress) {
            initBleData(macAddress);
          } else {
            console.error(
              "MAC Address not found in successful connection data:",
              data
            );
          }
          responseCallback(data);
        }
      );
    }
  }, []);

  const handleConnectAndInit = async (e, macAddress) => {
    e?.preventDefault();
    e?.stopPropagation();
    setError(null);
    setConnectingMacAddress(macAddress);

    try {
      console.log("Starting connection process for:", macAddress);
      await connectToBluetoothDevice(macAddress);

      setTimeout(() => {
        // Redirect to BleDataPage immediately after connection
        navigate("/ble-data", { state: { loading: true, macAddress } });
      }, 25000);
    } catch (error) {
      console.error("Connection error:", error);
      setError(error.message || "Failed to connect to the device");
      setConnectingMacAddress(null);
    }
  };

  const connectToBluetoothDevice = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      console.log("Attempting to connect to device:", macAddress);

      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          try {
            console.log("Raw connection response:", responseData);
            const parsedData = JSON.parse(responseData);
            console.log("Parsed connection response:", parsedData);

            if (parsedData.respCode === "200") {
              resolve(parsedData);
            } else {
              reject(
                new Error(
                  `Connection failed: ${parsedData.respMsg || "Unknown error"}`
                )
              );
            }
          } catch (error) {
            console.error("Error parsing connection response:", error);
            reject(
              new Error(`Failed to parse connection response: ${error.message}`)
            );
          }
        }
      );
    });
  };

  const initBleData = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      console.log("Initializing BLE data for:", macAddress);

      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            console.log("Raw init response:", responseData);
            const parsedData = JSON.parse(responseData);
            console.log("Parsed init response:", parsedData);
            resolve(parsedData);
          } catch (error) {
            console.error("Error parsing init response:", error);
            reject(
              new Error(
                `Failed to parse initialization response: ${error.message}`
              )
            );
          }
        }
      );
    });
  };

  return (
    <div className="scan-data-page flex flex-col h-screen mt-6 w-full">
      <div className="min-h-screen bg-gray-100 w-full">
        {error && (
          <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="p-2">
          {uniqueDevice.length > 0 ? (
            <ul className="text-left">
              {uniqueDevice.map((device) => (
                <li
                  key={device.macAddress}
                  className="mt-2 p-2 border rounded-md shadow flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-700">
                      {device.name || "Unknown Device"}
                    </p>
                    <p className="text-gray-700">{device.macAddress}</p>
                    <div className="flex items-left">
                      {device.rssi > -50 ? (
                        <Wifi className="text-green-500" />
                      ) : device.rssi > -70 ? (
                        <Wifi className="text-yellow-500" />
                      ) : (
                        <WifiOff className="text-red-500" />
                      )}
                      <span className="text-sm text-gray-500">
                        {device.rssi}dBm
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleConnectAndInit(e, device.macAddress)}
                    className={`px-4 py-2 border rounded-md ml-4 transition-colors duration-300 ${
                      connectingMacAddress === device.macAddress
                        ? "bg-gray-600 text-white cursor-not-allowed animate-pulse"
                        : "bg-cyan-700 text-white"
                    }`}
                    disabled={connectingMacAddress === device.macAddress}
                  >
                    {connectingMacAddress === device.macAddress
                      ? "Connecting..."
                      : "Connect"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No BLE devices detected.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BleButtons;
