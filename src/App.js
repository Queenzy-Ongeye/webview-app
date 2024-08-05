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
  const [keyword, setKeyword] = useState("OVES");
  const [macAddress, setMacAddress] = useState("");

  const mainConfig = {
    itemBackgroundColor: "#ffffff",
    itemSelBackgroundColor: "#000000",
    itemSelTextColor: "#202ED1",
    itemTextColor: "#000000",
    items: [
      {
        contentUrl: "https://www.baidu.com/",
        iconSelUrl:
          "https://tse4-mm.cn.bing.net/th/id/OIP-C.MD5FdM4LTeNRm9dUmRasVgHaHa?rs=1&pid=ImgDetMain",
        iconUrl:
          "https://tse4-mm.cn.bing.net/th/id/OIP-C.MD5FdM4LTeNRm9dUmRasVgHaHa?rs=1&pid=ImgDetMain",
        itemText: "baidu",
        sortIndex: 0,
      },
      {
        contentUrl: "https://www.sougou.com/",
        iconSelUrl:
          "https://tse4-mm.cn.bing.net/th/id/OIP-C.MD5FdM4LTeNRm9dUmRasVgHaHa?rs=1&pid=ImgDetMain",
        iconUrl:
          "https://tse4-mm.cn.bing.net/th/id/OIP-C.MD5FdM4LTeNRm9dUmRasVgHaHa?rs=1&pid=ImgDetMain",
        itemText: "sougou",
        sortIndex: 3,
      },
      {
        contentUrl: "https://cn.bing.com/",
        iconSelUrl:
          "https://tse4-mm.cn.bing.net/th/id/OIP-C.MD5FdM4LTeNRm9dUmRasVgHaHa?rs=1&pid=ImgDetMain",
        iconUrl:
          "https://tse4-mm.cn.bing.net/th/id/OIP-C.MD5FdM4LTeNRm9dUmRasVgHaHa?rs=1&pid=ImgDetMain",
        itemText: "bing",
        sortIndex: 1,
      },
      {
        contentUrl: "https://www.google.com/",
        iconSelUrl:
          "https://tse4-mm.cn.bing.net/th/id/OIP-C.MD5FdM4LTeNRm9dUmRasVgHaHa?rs=1&pid=ImgDetMain",
        iconUrl:
          "https://tse4-mm.cn.bing.net/th/id/OIP-C.MD5FdM4LTeNRm9dUmRasVgHaHa?rs=1&pid=ImgDetMain",
        itemText: "google",
        sortIndex: 2,
      },
    ],
  };

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

        bridge.registerHandler("print", (responseData, responseCallback) => {
          try {
            const jsonData = JSON.parse(responseData.data);
            setBleData((prevData) => [...prevData, jsonData]);
          } catch (error) {
            console.error("Error parsing JSON data from 'print' handler:", error);
          }
        });

        bridge.registerHandler("findBleDevice", (responseData, responseCallback) => {
          try {
            const jsonData = JSON.parse(responseData.data);
            setBleData((prevData) => [...prevData, jsonData]);
            setDetectedDevices((prevDevices) => [...prevDevices, jsonData]);
            setKeyword(jsonData.keyword || keyword);
            setMacAddress(jsonData.macAddress || macAddress);
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
  }, [bridgeInitialized, keyword, macAddress]);

  const startBleScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "startBleScan",
        keyword,
        (responseData) => {
          console.log(responseData);
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
          console.log(responseData);
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
          console.log(responseData);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const jump2MainActivity = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        "jump2MainActivity",
        JSON.stringify(mainConfig),
        (responseData) => {
          console.log(responseData);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized.");
    }
  };

  const connectToBluetoothDevice = () => {
    if (window.WebViewJavascriptBridge && macAddress) {
      window.WebViewJavascriptBridge.callHandler(
        "connBleByMacAddress",
        macAddress,
        (responseData) => {
          console.log(responseData);
        }
      );
    } else {
      console.error("WebViewJavascriptBridge is not initialized or MAC address is not set.");
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
                  startQrCode={startQrCode}
                  jump2MainActivity={jump2MainActivity}
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
