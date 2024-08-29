import React from 'react';
import Button from './Button';

const BottomActionBar = ({ onStartScan, onStopScan, onScanData, isScanning }) => {
  return (
    <div className="bg-cyan-900 text-white py-2 flex justify-around">
      <Button
        onClick={onStartScan}
        disabled={isScanning}
        className={isScanning ? 'bg-gray-800 text-gray-600' : 'bg-white text-cyan-700'}
      >
        {isScanning ? 'Scanning...' : 'Start BLE Scan'}
      </Button>
      <Button
        onClick={onStopScan}
        className="bg-white text-cyan-700"
      >
        Stop Scan
      </Button>
      <Button
        onClick={onScanData}
        className="bg-white text-cyan-700"
      >
        ScanQrCode
      </Button>
    </div>
  );
};

export default BottomActionBar;
