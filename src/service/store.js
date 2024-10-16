import React, { createContext, useReducer, useContext } from "react";

const initialState = {
  bridgeInitialized: false,
  isScanning: false,
  bleData: [],
  detectedDevices: [],
  initBleData: null, // State for initialization data
  isQRScanning: false, // New state for QR scanning
  scannedData: null, // state to hold QR Data
  isLoading: false,
  mqttClient: null,
  mqttMessage: null, // Add state for storing MQTT message
  matchingDevice:null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_BRIDGE_INITIALIZED":
      return { ...state, bridgeInitialized: action.payload };
    case "SET_IS_SCANNING":
      return { ...state, isScanning: action.payload };
    case "SET_BLE_DATA":
      return { ...state, bleData: action.payload };
    case "SET_IS_LOADING":
      return { ...state, isLoading: action.payload };
    case "ADD_DETECTED_DEVICE":
      return {
        ...state,
        detectedDevices: [...state.detectedDevices, action.payload],
      };
    case "SET_INIT_BLE_DATA":
      return { ...state, initBleData: action.payload };
    case "SET_QR_SCANNING":
      return { ...state, isQRScanning: action.payload };
    case "SET_SCANNED_DATA":
      return { ...state, qrData: action.payload };
    case "SET_MQTT_CLIENT":
      return { ...state, mqttClient: action.payload };
    case "SET_MQTT_MESSAGE":
      return { ...state, mqttMessage: action.payload }; // Add case for MQTT messages
    case "SET_MATCHING_DEVICE":
      return { ...state, matchingDevice: action.payload };
    default:
      return state;
  }
};

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
