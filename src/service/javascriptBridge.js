// Function for starting BLE Scan

import { ToastContainer, toast, Bounce } from "react-toastify";

// Starting Ble scan
export const startBleScan = () => {
  if (window.WebViewJavascriptBridge) {
    window.WebViewJavascriptBridge.callHandler(
      "startBleScan",
      "",
      (responseData) => {
        try {
          const jsonData = JSON.parse(responseData);
          dispatch({ type: "SET_BLE_DATA", payload: jsonData });
          console.log("BLE Data:", jsonData);
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

// Cancelling or stopping ble Scan
export const stopBleScan = () => {
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

// Connecting to a single Ble Device using the macAddress
export const connectToBluetoothDevice = async (macAddress) => {
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
          console.log("BLE Device Data:", parsedData);
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

// Initializing BLE Data using the macAddress retrieved from connectToBluetoothDevice()
export const initBleData = async (macAddress) => {
  if (window.WebViewJavascriptBridge) {
    window.WebViewJavascriptBridge.callHandler(
      "initBleData",
      macAddress,
      (responseData) => {
        try {
          const parsedData = JSON.parse(responseData);
          dispatch({ type: "SET_INIT_BLE_DATA", payload: parsedData });
          console.log("BLE Init Data:", parsedData);
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

// Function to connect to MQTT
export const connectMqtt = () => {
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
        if (responseData.error) {
          console.error("MQTT connection error:", responseData.error.message);
          toast.error("MQTT Connection failed", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            transition: Bounce,
          });
        } else {
          toast.success(`MQTT Connected sussessfully`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            transition: Bounce,
          });
        }
      }
    );
  } else {
    console.error("WebViewJavascriptBridge is not initialized.");
  }
};

// Function to subscribe to an MQTT topic
export const subscribeToMqttTopic = () => {
  if (window.WebViewJavascriptBridge) {
    const subscriptionData = {
      topic: "emit/content/fatory/#",
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
