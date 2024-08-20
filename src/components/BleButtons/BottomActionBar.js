import React from 'react';

const BottomActionBar = ({ onStartScan, onStopScan, onSettings }) => {
  return (
    <div className="bg-cyan-500 text-white py-2 flex justify-around">
      <button className="py-2 px-4 bg-white text-cyan-500 rounded hover:bg-gray-100" onClick={onStartScan}>
        Start Scan
      </button>
      <button className="py-2 px-4 bg-white text-cyan-500 rounded hover:bg-gray-100" onClick={onStopScan}>
        Stop Scan
      </button>
      <button className="py-2 px-4 bg-white text-cyan-500 rounded hover:bg-gray-100" onClick={onSettings}>
        Settings
      </button>
    </div>
  );
};

export default BottomActionBar;