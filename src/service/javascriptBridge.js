// Function for starting BLE Scan
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

// Function for stopping scan
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

// Fuction for connecting to a specific mark address
export const connectToBluetoothDevice = (macAddress) => {
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

// Function for initializing BleBata
export const initBleData = (macAddress) => {
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
        } else {
          console.log("MQTT connected:", responseData);
        }
      }
    );
  } else {
    console.error("WebViewJavascriptBridge is not initialized.");
  }
};

// Fucntion for publishing to MQTT
export const publishMqttMessage = (topic) => {
  if (window.WebViewJavascriptBridge) {
    if (!data || data.length === 0) {
      console.error("No BLE data available to publish.");
      return;
    }

    const publishData = {
      topic: topic,
      qos: 0, // Quality of Service level
      content: JSON.stringify(data), // Publish BLE data as content
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
