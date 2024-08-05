import React, { useEffect } from "react";
import BleButtons from "./components/BleButtons/BleButtons";
import { useStore } from "./service/store";

const Home = () => {
  const { state, dispatch } = useStore();

  useEffect(() => {
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
            const parsedData = JSON.parse(data);
            console.log("Received data from 'print':", parsedData);
            dispatch({ type: "SET_BLE_DATA", payload: parsedData.data });
            responseCallback(parsedData.data);
          } catch (error) {
            console.error("Error parsing JSON data from 'print' handler:", error);
          }
        });

        bridge.registerHandler("findBleDeviceCallBack", (data, responseCallback) => {
          try {
            const parsedData = JSON.parse(data);
            console.log("Received data from 'findBleDeviceCallBack':", parsedData);
            dispatch({ type: "SET_DETECTED_DEVICES", payload: parsedData.data });
            responseCallback(parsedData.data);
          } catch (error) {
            console.error("Error parsing JSON data from 'findBleDeviceCallBack' handler:", error);
          }
        });

        dispatch({ type: "SET_BRIDGE_INITIALIZED", payload: true });
        console.log("WebViewJavascriptBridge initialized.");
      }
    };

    connectWebViewJavascriptBridge(setupBridge);
  }, [state.bridgeInitialized, dispatch]);

  const startBleScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        "",
        (responseData) => {
          console.log("Response from startBleScan:", responseData);
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
          const jsonData = JSON.parse(responseData);
          dispatch({ type: "SET_BLE_DATA", payload: jsonData });
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const connectToBluetoothDevice = (macAddress) => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          const parsedData = JSON.parse(responseData);
          dispatch({ type: "SET_BLE_DATA", payload: parsedData });
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  console.log("State in Home component:", state);

  return (
    <BleButtons
      startBleScan={startBleScan}
      stopBleScan={stopBleScan}
      toastMsg={toastMsg}
      bleData={state.bleData}
      isScanning={state.isScanning}
      connectToBluetoothDevice={connectToBluetoothDevice}
      detectedDevices={state.detectedDevices}
    />
  );
};

export default Home;
