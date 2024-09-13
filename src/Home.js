import React, { useEffect } from "react";
import BleButtons from "./components/BleButtons/BleButtons";
import { useStore } from "./service/store";
import BottomActionBar from "./components/BleButtons/BottomActionBar";
import { getAllData, getDataByBarcode } from "./utility/indexedDB";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

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
      }
    };

    const setupBridge = (bridge) => {
      if (!state.bridgeInitialized) {
        bridge.init((message, responseCallback) => {
          responseCallback("js success!");
        });

        // Registering MQTT handlers
        bridge.registerHandler(
          "mqttMessageReceived",
          (data, responseCallback) => {
            try {
              console.log("MQTT message received:", data);
              dispatch({ type: "SET_MQTT_MESSAGE", payload: JSON.parse(data) });
              responseCallback(data);
            } catch (error) {
              console.error("Error parsing MQTT message:", error);
            }
          }
        );

        dispatch({ type: "SET_BRIDGE_INITIALIZED", payload: true });
        console.log("WebViewJavascriptBridge initialized.");
      }
    };

    connectWebViewJavascriptBridge(setupBridge);
  }, [state.bridgeInitialized, dispatch]);

  // Function to connect to MQTT
  const connectMqtt = () => {
    if (window.WebViewJavascriptBridge) {
      const mqttConfig = {
        username: "Admin",
        password: "7xzUV@MT",
        clientId: "123",
        hostname: "mqtt.omnivoltaic.com",
        port: 1883,
      };
      window.WebViewJavascriptBridge.callHandler(
        "connectMqtt",
        mqttConfig,
        (responseData) => {
          console.log("MQTT connected:", responseData);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  // Function to subscribe to an MQTT topic
  const subscribeToMqttTopic = (topic) => {
    if (window.WebViewJavascriptBridge) {
      const subscriptionData = {
        topic: topic,
        qos: 0, // Quality of Service level
      };
      window.WebViewJavascriptBridge.callHandler(
        "mqttSubTopic",
        subscriptionData,
        (responseData) => {
          console.log("Subscribed to topic:", responseData);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  // Function to publish `state.initBleData` as a message to an MQTT topic
  const publishMqttMessage = (topic) => {
    if (window.WebViewJavascriptBridge) {
      if (!state.initBleData) {
        console.error("No initBleData available to publish.");
        return;
      }

      const publishData = {
        topic: topic,
        qos: 0, // Quality of Service level
        content: JSON.stringify(state.initBleData), // Send initBleData as the content
      };
      window.WebViewJavascriptBridge.callHandler(
        "mqttPublishMsg",
        publishData,
        (responseData) => {
          console.log("Message published to MQTT topic:", responseData);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
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
      <div className="mqtt-controls mt-4 grid grid-cols-3 sm:grid-cols-3 gap-2 w-full">
        <button
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
          onClick={connectMqtt}
        >
          Connect to MQTT
        </button>
        <button
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
          onClick={() => subscribeToMqttTopic("/a/b/c")}
        >
          Subscribe to Topic
        </button>
        <button
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
          onClick={() => publishMqttMessage("/a/b/c")}
        >
          Publish BLE Init Data
        </button>
      </div>
    </div>
  );
};

export default Home;
