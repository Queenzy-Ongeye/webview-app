import React, { useEffect, useState } from "react";
import "./App.css";
import ReusableTable from "./components/table/table";
import { columnsData } from "./components/table/columns";

const App = () => {
  const [bridgeInitialized, setBridgeInitialized] = useState(false);
  const [bleData, setBleData] = useState([]);
  const [isScanning, setIsScanning] = useState(false); // New state to track scanning status

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
      setIsScanning(true); // Set scanning status to true
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
      setIsScanning(false); // Set scanning status to false
    } else {
      console.error("WebViewJavascriptBridge is not initialized or scanning is not active.");
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
    <div className="absolute inset-0 flex flex-col justify-around items-center bg-black">
      <div id="app" className="flex-1 h-4/5 flex flex-col flex-wrap mt-2">
        <button className="w-24 h-24 bg-slate-50" onClick={startBleScan}>
          startBleScan
        </button>
        {bleData.length > 0 && (
          <ReusableTable
            tableColumns={columnsData}
            tableData={bleData}
            title={"Response Data"}
          />
        )}
        <button className="w-24 h-24 mt-2 bg-slate-50" onClick={stopBleScan}>
          stopBleScan
        </button>
        <button className="w-24 h-24 mt-2 bg-slate-50" onClick={toastMsg}>
          toastMsg
        </button>
      </div>
    </div>
  );
};

export default App;