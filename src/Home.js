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

    const initMqttConnections = async () => {
      setLoading(true);
      try {
        await new Promise((resolve, reject) => {
          connectWebViewJavascriptBridge((bridge) => {
            setupBridge(bridge);
            resolve();
          });
        });
        const mqttConfig = {
          host: "wss://mqtt.omnivoltaic.com",
          port: 1883,
          path: "/mqtt",
        };

        const client = new Paho.MQTT.Client(
          `${mqttConfig.host}:${mqttConfig.port}${mqttConfig.path}`);

        client.onConnectionLost = (responseObject) => {
          console.log("Connection Lost: " + responseObject.errorMessage);
          setLoading(false);
          if (responseObject.errorCode !== 0) {
            client.connect({
              onSuccess: () => {
                mqttClientRef.current = client;
                dispatch({ type: "SET_MQTT_CLIENT", payload: client });
              },
              onFailure: (err) => {
                console.error("Reconnection to MQTT broker failed:", err);
              },
            });
          }
        };

        client.onMessageArrived = (message) => {
          console.log("Message arrived: " + message.payloadString);
        };

        client.connect({
          onSuccess: () => {
            mqttClientRef.current = client;
            dispatch({ type: "SET_MQTT_CLIENT", payload: client });
            setLoading(false);
          },
          mqttVersion: 3,
          username: "Scanner1",
          password: "!mqttsc.2024#",
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

    if (!state.mqttClient && state.bridgeInitialized) {
      initMqttConnections();
    }
    const intervalId = setInterval(initMqttConnections, 60000);
    return () => clearInterval(intervalId);
  }, [state.bridgeInitialized, dispatch, state.mqttClient]);

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

  const publishMqttData = (topic, message, qos = 0) => {
    if (mqttClientRef.current && mqttClientRef.current.isConnected()) {
      const msg = new Paho.MQTT.Message(message);
      msg.destinationName = topic;
      msg.qos = qos;
      mqttClientRef.current.send(msg);
      console.log(`Message "${message}" published to topic "${topic}"`);
    } else {
      console.error("MQTT client is not connected.");
    }
  };

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
