import React, { createContext, useReducer, useContext } from "react";

const initialState = {
  bridgeInitialized: false,
  isScanning: false,
  bleData: [],
  detectedDevices: [],
  initBleData: null, // State for initialization data
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_BRIDGE_INITIALIZED":
      return { ...state, bridgeInitialized: action.payload };
    case "SET_IS_SCANNING":
      return { ...state, isScanning: action.payload };
    case "SET_BLE_DATA":
      return { ...state, bleData: action.payload };
    case "ADD_DETECTED_DEVICE":
      return { ...state, detectedDevices: [...state.detectedDevices, action.payload] };
    case "SET_INIT_BLE_DATA":
      return { ...state, initBleData: action.payload };
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
