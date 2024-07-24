import React, { useEffect, useState } from "react";
import "./App.css";
import TablePage from "./components/table/TablePage";
import BleButtons from "./components/BleButtons/BleButtons";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App = () => {
  const [bridgeInitialized, setBridgeInitialized] = useState(false);
  const [bleData, setBleData] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

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
      if (!bridgeInitialized) {
        bridge.init((message, responseCallback) => {
          responseCallback("js success!");
        });

        bridge.registerHandler("print", (data, responseCallback) => {
          setBleData((prevData) => [...prevData, data]);
          responseCallback(data);
        });

        bridge.registerHandler("findBleDevice", (data, responseCallback) => {
          setBleData((prevData) => [...prevData, data]);
          responseCallback(data);
        });

        setBridgeInitialized(true);
        console.log("WebViewJavascriptBridge initialized.");
      }
    };

    connectWebViewJavascriptBridge(setupBridge);
  }, [bridgeInitialized]);

  const startBleScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        "",
        (responseData) => {
          setBleData((prevData) => [...prevData, responseData]);
        }
      );
      setIsScanning(true);
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const stopBleScan = () => {
    if (window.WebViewJavascriptBridge && isScanning) {
      window.WebViewJavascriptBridge.callHandler(
        "stopBleScan",
        "",
        (responseData) => {
          console.log("Scanning stopped");
        }
      );
      setIsScanning(false);
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
          setBleData((prevData) => [...prevData, responseData]);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <BleButtons
              startBleScan={startBleScan}
              stopBleScan={stopBleScan}
              toastMsg={toastMsg}
              bleData={bleData}
            />
          }
        />
        <Route path="/table" element={<TablePage bleData={bleData} />} />
      </Routes>
    </Router>
  );
};

export default App;
