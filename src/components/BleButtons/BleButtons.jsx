import React from "react";
import { useNavigate } from "react-router-dom";

const BleButtons = ({ startBleScan, stopBleScan, toastMsg }) => {
  const navigate = useNavigate();
  const handleStartBleScan = () => {
    startBleScan();
    navigate("/table");
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-around items-center bg-black">
      <div id="app" className="flex-1 h-4/5 flex flex-col flex-wrap mt-2">
        <button
          className="w-64 h-16 rounded-md bg-slate-50"
          onClick={handleStartBleScan}
        >
          startBleScan
        </button>
        <button
          className="w-64 h-16 rounded-md mt-2 bg-slate-50"
          onClick={stopBleScan}
        >
          stopBleScan
        </button>
        <button
          className="w-64 h-16 rounded-md mt-2 bg-slate-50"
          onClick={toastMsg}
        >
          toastMsg
        </button>
      </div>
    </div>
  );
};

export default BleButtons;
