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
      // Trigger native QR/Barcode scan via the bridge
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        999, // Arbitrary request ID
        (responseData) => {
          try {
            console.log("Response from startQrCodeScan", responseData);

            // Parse the nested response data
            const parsedData = JSON.parse(responseData.data);

            if (
              !parsedData ||
              !parsedData.respData ||
              !parsedData.respData.value
            ) {
              throw new Error("No valid QR or barcode scan data received");
            }

            const scannedValue = parsedData.respData.value; // Extract the scanned value (barcode/QR code)
            console.log("Scanned Value:", scannedValue);

            // Process the scanned data to check whether it's a QR code or barcode
            handleScanData(scannedValue);
          } catch (error) {
            console.error("Error during QR/Barcode scan:", error.message);
          }
        }
      );
      // Update the state to show scanning is active
      dispatch({ type: "SET_QR_SCANNING", payload: true });
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const handleScanData = (data) => {
    console.log("Scanned data received: ", data);

    // Check if it's a barcode
    if (isBarcode(data)) {
      fetchProductDetails(data); // Process barcode to fetch product details
    }
    // Otherwise, it should be a QR code
    else if (isQrCode(data)) {
      dispatch({ type: "SET_QR_DATA", payload: data }); // Save QR code data in state
    } else {
      console.error("Invalid scan data. Neither a barcode nor a QR code.");
    }
  };

  // Function to check if data is a barcode (numeric string with specific lengths)
  const isBarcode = (data) => {
    const numericPattern = /^[0-9]+$/; // Only numeric values
    const barcodeLengths = [8, 12, 13]; // Common barcode lengths (UPC, EAN)
    return numericPattern.test(data) && barcodeLengths.includes(data.length);
  };

  // Function to check if data is a QR code (URLs or structured text)
  const isQrCode = (data) => {
    const urlPattern = /^(http|https):\/\/[^ "]+$/; // Checks if it's a URL
    const structuredDataPattern =
      /^[a-zA-Z0-9]+=[a-zA-Z0-9]+(&[a-zA-Z0-9]+=[a-zA-Z0-9]+)*$/; // Checks if it's structured text
    const nonNumericPattern = /[^0-9]/; // Ensures it's not purely numeric

    // Check common QR code patterns
    return (
      urlPattern.test(data) ||
      structuredDataPattern.test(data) ||
      (data.length > 20 && nonNumericPattern.test(data)) // Ensure QR code has enough complexity
    );
  };

  const fetchProductDetails = (barcode) => {
    getDataByBarcode(barcode)
      .then((product) => {
        if (product) {
          dispatch({ type: "SET_QR_DATA", payload: product });
          // Navigate only if valid scan data is available
          navigate("/scan-data", { state: { scannedData: product } });
        } else {
          console.error("Product not found for barcode:", barcode);
        }
      })
      .catch((error) => {
        console.error("Error fetching product details: ", error);
      });
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
          onClick={() => subscribeToMqttTopic("emit/content/bleData")}
        >
          Subscribe to Topic
        </button>
        <button
          className="w-full py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200"
          onClick={() => publishMqttMessage("emit/content/bleData")}
        >
          Publish BLE Init Data
        </button>
      </div>
    </div>
  );
};

export default Home;
