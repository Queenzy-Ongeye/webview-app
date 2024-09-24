// Function for starting BLE Scan

import { toast } from "react-toastify";

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
