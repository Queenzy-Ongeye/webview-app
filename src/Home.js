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
