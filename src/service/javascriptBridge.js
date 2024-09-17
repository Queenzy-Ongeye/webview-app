// Function for starting BLE Scan

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
        } else {
          console.log("MQTT connected:", responseData);
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
