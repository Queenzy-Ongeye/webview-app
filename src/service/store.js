import React, { createContext, useReducer, useContext } from "react";

const initialState = {
  bridgeInitialized: false,
  bleData: [],
  isScanning: false,
  detectedDevices: [],
  keyword: "OVES",
  selectedMacAddress: "",
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_BRIDGE_INITIALIZED":
      return { ...state, bridgeInitialized: action.payload };
    case "SET_BLE_DATA":
      return { ...state, bleData: [...state.bleData, action.payload] };
    case "SET_IS_SCANNING":
      return { ...state, isScanning: action.payload };
    case "SET_DETECTED_DEVICES":
      return {
        ...state,
        detectedDevices: [...state.detectedDevices, action.payload],
      };
    case "SET_KEYWORD":
      return { ...state, keyword: action.payload };
    case "SET_SELECTED_MAC_ADDRESS":
      return { ...state, selectedMacAddress: action.payload };
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
