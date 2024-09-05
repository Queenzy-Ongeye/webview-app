import React, { useEffect, useRef, useState } from "react";
import BleButtons from "./components/BleButtons/BleButtons";
import { useStore } from "./service/store";
import BottomActionBar from "./components/BleButtons/BottomActionBar";
import { getAllData, getDataByBarcode } from "./utility/indexedDB";
import { useNavigate } from "react-router-dom";
import Paho from "paho-mqtt";

const Home = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // New loading state
  const mqttClientRef = useRef(null); // Ref to store MQTT client persistently
  const maxChunkSize = 128 * 1024;

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
              const parsedData = JSON.parse(data);
              if (parsedData) {
                dispatch({ type: "ADD_DETECTED_DEVICE", payload: parsedData });
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
          dispatch({ type: "SET_QR_DATA", payload: data });
          responseCallback(data);
        }
      );
    };
    connectWebViewJavascriptBridge(setupBridge);
  }, [state.bridgeInitialized, dispatch]);

  // MQTT connection initialization
  const initMqttConnections = async () => {
    setLoading(true);
    console.log("Starting MQTT initialization...");

    try {
      // MQTT WebSocket configuration (Use port 8084 for WSS)
      const mqttConfig = {
        host: "mqtt.omnivoltaic.com",
        port: 8084,
        path: "/mqtt",
      };

      // Create Paho MQTT client using WebSocket Secure (WSS)
      const client = new Paho.MQTT.Client(
        `${mqttConfig.host}`,
        Number(mqttConfig.port),
        mqttConfig.path
      );

      // Handle connection loss
      client.onConnectionLost = (responseObject) => {
        console.log("Connection Lost: " + responseObject.errorMessage);
        setLoading(false);
        if (responseObject.errorCode !== 0) {
          console.log("Attempting to reconnect...");
          client.connect({
            onSuccess: () => {
              console.log("Reconnected to MQTT broker.");
              mqttClientRef.current = client;
              dispatch({ type: "SET_MQTT_CLIENT", payload: client });
            },
            onFailure: (err) => {
              console.error("Reconnection failed:", err);
            },
          });
        }
      };

      // Handle incoming MQTT messages
      client.onMessageArrived = (message) => {
        console.log("Message arrived: " + message.payloadString);
      };

      console.log("Connecting to MQTT broker...");
      // Connect to MQTT broker with SSL (WSS) and authentication
      client.connect({
        onSuccess: () => {
          console.log("Successfully connected to MQTT broker via WSS.");
          mqttClientRef.current = client; // Store client in ref
          dispatch({ type: "SET_MQTT_CLIENT", payload: client });
          setLoading(false);
        },
        useSSL: true, // Enable SSL for secure WebSocket connection
        mqttVersion: 3, // MQTT version
        timeout: 10, // Increased timeout for connection attempt
        keepAliveInterval: 30, // Increased keep-alive interval
        username: "Scanner1", // MQTT broker username
        password: "!mqttsc.2024#", // MQTT broker password
        onFailure: (err) => {
          console.error("MQTT Connection failed:", err);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Error during MQTT initialization:", error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mqttClientRef.current && state.bridgeInitialized) {
      initMqttConnections();
    }
    // Reconnect every 60 seconds if necessary
    const intervalId = setInterval(() => {
      if (!mqttClientRef.current) {
        initMqttConnections();
      }
    }, 6000); // 60 seconds reconnect interval

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [state.bridgeInitialized, dispatch]);

  // Function to chunk large data into smaller pieces
  const chunkMessage = (data, size) => {
    const chunks = [];
    for (let i = 0; i < data.length; i += size) {
      chunks.push(data.substring(i, i + size));
    }
    return chunks;
  };

  // Function to publish MQTT data in chunks if the data is too large
  const publishMqttData = (topic, data, qos = 0) => {
    if (!mqttClientRef.current) {
      console.error("MQTT client is not connected.");
      return;
    }
    // Check if the message exceeds the max chunk size
    if (data.length > maxChunkSize) {
      console.log(
        `Data too large, chunking into ${maxChunkSize / 1024} KB chunks.`
      );
      const chunks = chunkMessage(data, maxChunkSize);
      chunks.forEach((chunk, index) => {
        const message = new Paho.MQTT.Message(chunk);
        message.destinationName = topic;
        message.qos = qos;
        mqttClientRef.current.send(message);
        console.log(`Sent chunk ${index + 1}/${chunks.length}`);
      });
    } else {
      // Send the data directly if it's under the max chunk size
      const message = new Paho.MQTT.Message(data);
      message.destinationName = topic;
      message.qos = qos;
      mqttClientRef.current.send(message);
      console.log("Message sent:", message);
    }
  };

  useEffect(() => {
    if (state.detectedDevices.length > 0) {
      console.log("Detected devices:", state.detectedDevices);
      console.log("MQTT Client after device detection:", mqttClientRef.current);
    }
  }, [state.detectedDevices]);

  useEffect(() => {
    if (state.initBleData) {
      const topic = "emit/bleData/general";
      const message = JSON.stringify({ initBleData: state.initBleData });
      publishMqttData(topic, message, 0);
    }
  }, [state.initBleData]);

  const startBleScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        "",
        (responseData) => {
          try {
            const jsonData = JSON.parse(responseData);
            dispatch({ type: "SET_BLE_DATA", payload: jsonData });
          } catch (error) {
            console.error(
              "Error parsing JSON data from 'startBleScan' response:",
              error
            );
          }
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

  const connectToBluetoothDevice = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData.respCode === "200") {
              initBleData(macAddress);
            }
            dispatch({ type: "SET_BLE_DATA", payload: parsedData });
          } catch (error) {
            console.error(
              "Error parsing JSON data from 'connBleByMacAddress' response:",
              error
            );
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const initBleData = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
          } catch (error) {
            console.error(
              "Error parsing JSON data from 'initBleData' response:",
              error
            );
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const startQrCode = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        999,
        (responseData) => {
          dispatch({ type: "SET_QR_DATA", payload: responseData });
          navigate("/scan-data", { state: { scannedData: responseData } });
        }
      );
      dispatch({ type: "SET_QR_SCANNING", payload: true });
    } else {
      console.error("Web view initialization failed");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
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
    </div>
  );
};

export default Home;
