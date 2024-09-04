import React, { useEffect, useState } from "react";
import BleButtons from "./components/BleButtons/BleButtons";
import { useStore } from "./service/store";
import BottomActionBar from "./components/BleButtons/BottomActionBar";
import { getAllData, getDataByBarcode } from "./utility/indexedDB";
import { useNavigate } from "react-router-dom";
import mqtt from "mqtt";

const Home = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    getAllData().then((data) => {
      if (data && data.length > 0) {
        dispatch({ type: "SET_BLE_DATA", payload: data });
      }
    });

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

        const timeout = setTimeout(() => {
          if (window.WebViewJavascriptBridge) {
            callback(window.WebViewJavascriptBridge);
            clearTimeout(timeout);
          } else {
            console.error(
              "WebViewJavascriptBridge is not initialized within the timeout period."
            );
          }
        }, 3000);
      }
    };

    const setupBridge = (bridge) => {
      if (!state.bridgeInitialized) {
        bridge.init((message, responseCallback) => {
          responseCallback("js success!");
        });

        bridge.registerHandler("print", (data, responseCallback) => {
          try {
            console.log("Raw data received from 'print':", data);
            const parsedData = JSON.parse(data);
            console.log("Parsed data from 'print':", parsedData);
            if (parsedData && parsedData.data) {
              dispatch({ type: "SET_BLE_DATA", payload: parsedData.data });
              responseCallback(parsedData.data);
            } else {
              throw new Error("Parsed data is not in the expected format.");
            }
          } catch (error) {
            console.error(
              "Error parsing JSON data from 'print' handler:",
              error
            );
          }
        });

        bridge.registerHandler(
          "findBleDeviceCallBack",
          (data, responseCallback) => {
            try {
              console.log(
                "Raw data received from 'findBleDeviceCallBack':",
                data
              );
              const parsedData = JSON.parse(data);
              console.log(
                "Parsed data from 'findBleDeviceCallBack':",
                parsedData
              );
              if (parsedData) {
                dispatch({ type: "ADD_DETECTED_DEVICE", payload: parsedData });
                console.log("Updated detectedDevices state:", parsedData);
                responseCallback(parsedData);
              } else {
                throw new Error("Parsed data is not in the expected format.");
              }
            } catch (error) {
              console.error(
                "Error parsing JSON data from 'findBleDeviceCallBack' handler:",
                error
              );
            }
          }
        );

        bridge.registerHandler(
          "bleConnectSuccessCallBack",
          (data, responseCallback) => {
            console.log("Bluetooth connection successful:", data);
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

        bridge.registerHandler(
          "bleConnectFailCallBack",
          (data, responseCallback) => {
            console.log("Bluetooth connection failed:", data);
            responseCallback(data);
          }
        );

        bridge.registerHandler(
          "bleInitDataCallBack",
          (data, responseCallback) => {
            console.log("Bluetooth initialization data received:", data);
            try {
              const parsedData = JSON.parse(data);
              dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
              responseCallback(parsedData);
            } catch (error) {
              console.error(
                "Error parsing JSON data from 'bleInitDataCallBack' handler:",
                error
              );
            }
          }
        );

        dispatch({ type: "SET_BRIDGE_INITIALIZED", payload: true });
        console.log("WebViewJavascriptBridge initialized.");
      }

      bridge.registerHandler(
        "scanQrCodeResultCallBack",
        (data, responseCallback) => {
          console.log("QR Code scan result:", data);
          dispatch({ type: "SET_QR_DATA", payload: data });
          responseCallback(data);
        }
      );

      dispatch({ type: "SET_BRIDGE_INITIALIZED", payload: true });
      console.log("WebViewJavascriptBridge initialized.");
    };

    const initConnections = async () => {
      try {
        // Initialize WebView bridge
        await new Promise((resolve, reject) => {
          connectWebViewJavascriptBridge((bridge) => {
            setupBridge(bridge);
            resolve();
          });
        });

        // Initialize MQTT connection
        const options = {
          username: "Scanner1",
          password: "!mqttsc.2024#",
          rejectUnauthorized: true,
        };

        const client = mqtt.connect("wss://mqtt.omnivoltaic.com:8883", options);

        client.on("connect", () => {
          console.log("Connected to MQTT broker");
          dispatch({ type: "SET_MQTT_CLIENT", payload: client });
          setLoading(false); // Stop loading once both MQTT and WebView bridge are initialized
        });

        client.on("error", (err) => {
          console.error("MQTT connection error:", err.message || err);
        });

        client.on("offline", () => {
          console.warn("MQTT client went offline. Attempting to reconnect...");
          client.reconnect(); // Reconnect if offline
        });

        client.on("disconnect", () => {
          console.log("Disconnected from MQTT broker");
        });

        return () => {
          if (client) client.end();
        };
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };

    initConnections();
  }, [dispatch, state.bridgeInitialized]);

  const publishAllServices = (dataList) => {
    if (typeof dataList === "object" && dataList !== null) {
      const dataListArray = Object.values(dataList);

      if (dataListArray.length > 0) {
        const filteredData = dataListArray.filter(
          (item) => !item.serviceNameEnum
        );

        if (filteredData.length > 0) {
          const topic = `emit/bleData/general`;
          const message = JSON.stringify({ filteredData });
          publishMqttData(topic, message);
        } else {
          console.warn("No items found without serviceNameEnum.");
        }
      } else {
        console.warn("DataList array is empty.");
      }
    } else {
      console.warn("DataList is either null or not a valid object.");
    }
  };

  const publishMqttData = (topic, message) => {
    const client = state.mqttClient;
    if (client && client.connected) {
      client.publish(topic, message, (err) => {
        if (err) {
          console.error("Publish error: ", err);
        } else {
          console.log(`Message "${message}" published to topic "${topic}"`);
        }
      });
    } else {
      console.error("MQTT client is not connected.");
    }
  };

  useEffect(() => {
    if (state.initBleData) {
      publishAllServices(state.initBleData);
    }
  }, [state.initBleData]);

  const startBleScan = () => {
    if (state.bridgeInitialized) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        "",
        (responseData) => {
          const jsonData = JSON.parse(responseData);
          dispatch({ type: "SET_BLE_DATA", payload: jsonData });
        }
      );
      dispatch({ type: "SET_IS_SCANNING", payload: true });
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const stopBleScan = () => {
    if (window.WebViewJavascriptBridge && state.isScanning) {
      window.WebViewJavascriptBridge.callHandler("stopBleScan", "", () => {
        console.log("Scanning stopped");
      });
      dispatch({ type: "SET_IS_SCANNING", payload: false });
    } else {
      console.error(
        "WebViewJavascriptBridge is not initialized or scanning is not active."
      );
    }
  };

  console.log("State in Home component:", state);

  return (
    <div className="flex flex-col min-h-screen">
      {loading ? (
        <div>Loading connections...</div>
      ) : (
        <>
          <div className="flex-grow">
            <BleButtons
              connectToBluetoothDevice={connectToBluetoothDevice}
              detectedDevices={state.detectedDevices}
              initBleData={initBleData}
              initBleDataResponse={state.initBleData}
              isLoading={state.isLoading}
            />
          </div>
          <BottomActionBar
            onStartScan={startBleScan}
            onStopScan={stopBleScan}
            onScanData={startQrCode}
            isScanning={state.isScanning}
          />
        </>
      )}
    </div>
  );
};

export default Home;
