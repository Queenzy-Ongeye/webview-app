import React, { useEffect, useState } from 'react';
import './App.css';

const App = () => {
  const [bridgeInitialized, setBridgeInitialized] = useState(false);

  useEffect(() => {
    const connectWebViewJavascriptBridge = (callback) => {
      if (window.WebViewJavascriptBridge) {
        callback(window.WebViewJavascriptBridge);
      } else {
        document.addEventListener(
          'WebViewJavascriptBridgeReady',
          () => {
            callback(window.WebViewJavascriptBridge);
          },
          false
        );

        // Add a timeout to handle the case where the bridge might not be initialized
        const timeout = setTimeout(() => {
          if (window.WebViewJavascriptBridge) {
            callback(window.WebViewJavascriptBridge);
            clearTimeout(timeout);
          } else {
            console.error('WebViewJavascriptBridge is not initialized within the timeout period.');
          }
        }, 3000); // Check again after 3 seconds
      }
    };

    const setupBridge = (bridge) => {
      if (!bridgeInitialized) {
        bridge.init((message, responseCallback) => {
          responseCallback('js success!');
        });

        bridge.registerHandler('print', (data, responseCallback) => {
          console.info(data);
          responseCallback(data);
        });

        bridge.registerHandler('findBleDevice', (data, responseCallback) => {
          console.info(data);
          responseCallback(data);
        });

        setBridgeInitialized(true);
        console.log('WebViewJavascriptBridge initialized.');
      }
    };

    connectWebViewJavascriptBridge(setupBridge);
  }, [bridgeInitialized]);

  const startBleScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler('startBleScan', '', (responseData) => {
        console.info(responseData);
      });
    } else {
      console.error('WebViewJavascriptBridge is not initialized.');
    }
  };

  const stopBleScan = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler('stopBleScan', '', (responseData) => {
        console.info(responseData);
      });
    } else {
      console.error('WebViewJavascriptBridge is not initialized.');
    }
  };

  const toastMsg = () => {
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler('toastMsg', 'toastMsg', (responseData) => {
        console.info(responseData);
      });
    } else {
      console.error('WebViewJavascriptBridge is not initialized.');
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        alignContent: 'center',
        backgroundColor: '#000000',
      }}
    >
      <div
        id="app"
        style={{
          flex: 1,
          height: '80%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'wrap',
        }}
      >
        <button style={{ width: '100px', height: '100px' }} onClick={startBleScan}>
          startBleScan
        </button>
        <button style={{ width: '100px', height: '100px', marginTop: '10px' }} onClick={stopBleScan}>
          stopBleScan
        </button>
        <button style={{ width: '100px', height: '100px', marginTop: '10px' }} onClick={toastMsg}>
          toastMsg
        </button>
      </div>
    </div>
  );
};

export default App;