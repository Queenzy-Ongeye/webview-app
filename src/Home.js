import React, { useEffect } from "react";
import BleButtons from "./components/BleButtons/BleButtons";
import { useStore } from "./service/store";
import BottomActionBar from "./components/BleButtons/BottomActionBar";
import { getAllData, getDataByBarcode } from "./utility/indexedDB";
import { useNavigate } from "react-router-dom";
import mqtt from "mqtt";

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
    // Setting up Javascript Bridge
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
            const macAddress = data.macAddress; // Assuming data contains the macAddress
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

      // Setting up QR Code scanner Handler
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

    connectWebViewJavascriptBridge(setupBridge);
  }, [state.bridgeInitialized, dispatch]);

  // MQTT Data intergration
  useEffect(() => {
    const options = {
      username: "Scanner1",
      password: "!mqttsc.2024#",
      rejectUnauthorized: false,
    };

    const client = mqtt.connect("wss://mqtt.omnivoltaic.com:8883", options);

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      dispatch({ type: "SET_MQTT_CLIENT", payload: client });
    });

    client.on("error", (err) => {
      console.error("MQTT connection error:", err.message || err);
      if (
        err.message.includes("WebSocket") ||
        err.message.includes("ECONNREFUSED")
      ) {
        console.error("Check broker URL, port, and WebSocket configuration.");
      }
    });

    client.on("offline", () => {
      console.warn("MQTT client went offline.");
    });

    client.on("disconnect", () => {
      console.log("Disconnected from MQTT broker");
    });

    return () => {
      if (client) client.end();
    };
  }, [dispatch]);

  const publishAllServices = (dataList) => {
    console.log("DataList object structure:", JSON.stringify(dataList, null, 2)); // Log structure

    // Extract array from the correct property of dataList (adjust according to the structure)
    const dataListArray = dataList.items || [];  // Adjust based on structure
  
    // Now check if we have a valid array
    if (Array.isArray(dataListArray)) {
      dataListArray.forEach((item) => {
        const serviceNameEnum = item.serviceNameEnum;
        const serviceProperty = item.serviceProperty;
        const uuid = item.uuid;
  
        const message = JSON.stringify({
          serviceProperty: serviceProperty,
          uuid: uuid,
        });
  
        const topic = `emit/bleData/${serviceNameEnum.toLowerCase()}`;
        console.log("Publishing to topic:", topic);
  
        publishMqttData(topic, message);
      });
    } else {
      console.warn("No data to publish or dataListArray is not an array.");
    }
  };
  

  const publishMqttData = (topic, message) => {
    const client = state.mqttClient;
    if (client) {
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

  // Assuming state.initBleData contains your dataList
  useEffect(() => {
    if (state.initBleData) {
      console.log("Publishing MQTT data:", state.initBleData);
      publishAllServices(state.initBleData);
    }
  }, [state.initBleData]);

  const startBleScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        "",
        (responseData) => {
          console.log("Response from startBleScan:", responseData);
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
      window.WebViewJavascriptBridge.callHandler(
        "stopBleScan",
        "",
        (responseData) => {
          console.log("Scanning stopped");
        }
      );
      dispatch({ type: "SET_IS_SCANNING", payload: false });
    } else {
      console.error(
        "WebViewJavascriptBridge is not initialized or scanning is not active."
      );
    }
  };

  const toastMsg = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "toastMsg",
        "toastMsg",
        (responseData) => {
          try {
            const jsonData = JSON.parse(responseData);
            dispatch({ type: "SET_BLE_DATA", payload: jsonData });
          } catch (error) {
            console.error(
              "Error parsing JSON data from 'toastMsg' response:",
              error
            );
          }
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const connectToBluetoothDevice = (macAddress) => {
    console.log(
      "Attempting to connect to Bluetooth device with MAC Address:",
      macAddress
    );
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            console.log("Bluetooth connection response:", parsedData);
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
    console.log("Initializing BLE data for MAC Address:", macAddress);
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            const parsedData = JSON.parse(responseData);
            console.log("Bluetooth initialization response:", parsedData);
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

  // QR Code onclick function
  const startQrCode = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startQrCodeScan",
        999,
        (responseData) => {
          console.log("Response from startQrCodeScan", responseData);
          dispatch({ type: "SET_QR_DATA", payload: responseData });
          navigate("/scan-data", { state: { scannedData: responseData } });
        }
      );
      dispatch({ type: "SET_QR_SCANNING", payload: true });
    } else {
      console.error("Web view initialization failed");
    }
  };

  const handleScanData = (data) => {
    console.log("Scanned data received: ", data);

    if (isBarcode(data)) {
      fetchProductDetails(data);
    } else if (isQrCode(data)) {
      dispatch({ type: "SET_QR_DATA", payload: data });
    }
  };

  const isBarcode = (data) => {
    const numericPattern = /^[0-9]+$/;
    const barcodeLengths = [12, 13, 8]; // Adjust lengths as necessary for your application

    return numericPattern.test(data) && barcodeLengths.includes(data.length);
  };

  const isQrCode = (data) => {
    const urlPattern = /^(http|https):\/\/[^ "]+$/;
    const structuredDataPattern =
      /^[a-zA-Z0-9]+=[a-zA-Z0-9]+(&[a-zA-Z0-9]+=[a-zA-Z0-9]+)*$/;
    const nonNumericPattern = /[^0-9]/;

    if (urlPattern.test(data)) {
      return true;
    }

    if (structuredDataPattern.test(data)) {
      return true;
    }

    if (data.length > 20 && nonNumericPattern.test(data)) {
      return true;
    }

    return false;
  };

  const fetchProductDetails = (barcode) => {
    // Make an API call or query your IndexedDB/local storage
    // to get product details using the barcode
    getDataByBarcode(barcode)
      .then((product) => {
        if (product) {
          dispatch({ type: "SET_PRODUCT_DATA", payload: product });
        } else {
          console.error("Product not found for barcode:", barcode);
        }
      })
      .catch((error) => {
        console.error("Error fetching product details: ", error);
      });
  };

  const handleSettings = () => {
    alert("Settings selected");
  };

  console.log("State in Home component:", state);

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
