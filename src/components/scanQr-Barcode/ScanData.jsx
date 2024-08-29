import React from "react";
import { useStore } from "../../service/store";
import { useLocation } from "react-router-dom";

const ScanData = () => {
  const { state } = useStore();
  const location = useLocation()
  const {scannedData } = location.state || {}

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1>Scanned Data</h1>
      <p>{scannedData}</p>
    </div>
  );
};

export default ScanData;
