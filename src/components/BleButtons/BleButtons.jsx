import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../service/store";
import { Wifi, WifiOff } from 'lucide-react';
import { Button } from "../reusableCards/Buttons";
import { toast } from "react-toastify";

const BleButtons = () => {
  const { dispatch, state } = useStore();
  const navigate = useNavigate();
  const [connectingMacAddress, setConnectingMacAddress] = useState(null);
  const [error, setError] = useState(null);

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
        async (data, responseCallback) => {
          console.log("Received bleConnectSuccessCallBack:", data);
          const macAddress = data.macAddress;
          if (macAddress) {
            await handleSuccessfulConnection(macAddress);
          } else {
            console.error(
              "MAC Address not found in successful connection data:",
              data
            );
            setError("Failed to retrieve MAC address after connection");
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
      // The navigation will be handled by the bleConnectSuccessCallBack
    } catch (error) {
      console.error("Connection error:", error);
      setError(error.message || "Failed to connect to the device");
      setConnectingMacAddress(null);
    }
  };

  const handleSuccessfulConnection = async (macAddress) => {
    console.log("Connection successful, initializing BLE data for:", macAddress);
    try {
      const bleData = await initBleData(macAddress);
      dispatch({ type: "SET_INIT_BLE_DATA", payload: bleData });
      navigate("/ble-data", { state: { macAddress } });
    } catch (error) {
      console.error("Error initializing BLE data:", error);
      setError("Failed to initialize BLE data. Please try again.");
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
            reject(new Error(`Failed to parse initialization response: ${error.message}`));
          }
        }
      );
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">BLE Devices</h1>
      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {uniqueDevice.length > 0 ? (
          uniqueDevice.map((device) => (
            <div
              key={device.macAddress}
              className="p-4 border rounded-md shadow flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{device.name || "Unknown Device"}</p>
                <p className="text-sm text-gray-600">{device.macAddress}</p>
                <div className="flex items-center mt-1">
                  {device.rssi > -50 ? (
                    <Wifi className="text-green-500 h-4 w-4 mr-1" />
                  ) : device.rssi > -70 ? (
                    <Wifi className="text-yellow-500 h-4 w-4 mr-1" />
                  ) : (
                    <WifiOff className="text-red-500 h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm text-gray-500">
                    {device.rssi}dBm
                  </span>
                </div>
              </div>
              <Button
                onClick={(e) => handleConnectAndInit(e, device.macAddress)}
                disabled={connectingMacAddress === device.macAddress}
                className={
                  connectingMacAddress === device.macAddress
                    ? "bg-gray-400"
                    : "bg-oves-blue"
                }
              >
                {connectingMacAddress === device.macAddress
                  ? "Connecting..."
                  : "Connect"}
              </Button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No BLE devices detected.</p>
        )}
      </div>
    </div>
  );
};

export default BleButtons;