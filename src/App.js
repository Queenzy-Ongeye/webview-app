import React, { useEffect, useState } from "react";
import "./index.css";
import TablePage from "./components/table/TablePage";
import BleButtons from "./components/BleButtons/BleButtons";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

const App = () => {
  const [bridgeInitialized, setBridgeInitialized] = useState(false);
  const [bleData, setBleData] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedDevices, setDetectedDevices] = useState([]);

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
          try {
            const parsedData = JSON.parse(data);
            const jsonData = JSON.parse(parsedData.data);
            console.log("Data is here...", jsonData); // Ensure the nested JSON is parsed
            setBleData((prevData) => [...prevData, jsonData]);
            responseCallback(jsonData);
          } catch (error) {
            console.error("Error parsing JSON data from 'print' handler:", error);
          }
        });

        bridge.registerHandler("findBleDevice", (data, responseCallback) => {
          try {
            const parsedData = JSON.parse(data);
            const jsonData = JSON.parse(parsedData.data); // Ensure the nested JSON is parsed
            setBleData((prevData) => [...prevData, jsonData]);
            setDetectedDevices((prevDevices) => [...prevDevices, jsonData]);
            responseCallback(jsonData);
          } catch (error) {
            console.error("Error parsing JSON data from 'findBleDevice' handler:", error);
          }
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

  const connectToBluetoothDevice = (macAddress) => {
    console.log("-------123-----", macAddress)
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          console.log("Connected to Bluetooth device:", responseData);
          const parsedData = JSON.parse(responseData);
          setBleData((prevData) => [...prevData, parsedData]);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <nav className="bg-blue-600 text-white py-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-lg font-semibold">
              Home
            </Link>
            <Link to="/table" className="text-lg font-semibold">
              Data Table
            </Link>
          </div>
        </nav>
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route
              path="/"
              element={
                <BleButtons
                  startBleScan={startBleScan}
                  stopBleScan={stopBleScan}
                  toastMsg={toastMsg}
                  bleData={bleData}
                  isScanning={isScanning}
                  connectToBluetoothDevice={connectToBluetoothDevice}
                  detectedDevices={detectedDevices}
                />
              }
            />
            <Route path="/table" element={<TablePage bleData={bleData} />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 text-white py-4 text-center">
          &copy; 2024 Omnivoltaic Energy Solutions. All rights reserved.
        </footer>
      </div>
    </Router>
  );
};

export default App;
