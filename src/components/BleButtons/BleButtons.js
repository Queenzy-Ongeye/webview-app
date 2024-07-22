import React from "react";

const BleButtons = ({ startBleScan, stopBleScan, toastMsg }) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-around items-center bg-black">
      <div id="app" className="flex-1 h-4/5 flex flex-col flex-wrap mt-2">
        <button className="w-60 h-14 rounded-md bg-slate-50" onClick={startBleScan}>
          startBleScan
        </button>
        <button className="w-60 h-14 rounded-md mt-2 bg-slate-50" onClick={stopBleScan}>
          stopBleScan
        </button>
        <button className="w-60 h-14 rounded-md mt-2 bg-slate-50" onClick={toastMsg}>
          toastMsg
        </button>
      </div>
    </div>
  );
};

export default BleButtons;
