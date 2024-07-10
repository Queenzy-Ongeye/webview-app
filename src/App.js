import React, { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  const [bridgeInitialized, setBridgeInitialized] = useState(false);


  return (
    <div className="absolute inset-0 flex flex-col justify-around items-center bg-black">
      <div id="app" className="flex-1 h-4/5 flex flex-col flex-wrap mt-2">
        <button className="w-24 h-24 bg-slate-50" onclick={startBleScan}>
          startBleScan
        </button>
        <button className="w-24 h-24 mt-2 bg-slate-50" onclick={stopBleScan}>
          stopBleScan
        </button>
        <button className="w-24 h-24 mt-2 bg-slate-50" onclick={toastMsg}>
          toastMsg
        </button>
      </div>
    </div>
  );
};

export default App;
