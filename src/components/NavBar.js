import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar = () => {
  return (
    <nav className="bg-cyan-700 text-white py-4">
      <div className="container mx-auto flex justify-around">
        <Link to="/" className="px-4 py-2 hover:bg-cyan-600 rounded">
          Home
        </Link>
        <Link to="/ble-scan" className="px-4 py-2 hover:bg-cyan-600 rounded">
          BLE Scan
        </Link>
        <Link to="/qr-code-scan" className="px-4 py-2 hover:bg-cyan-600 rounded">
          QR Code Scan
        </Link>
      </div>
    </nav>
  );
};

export default NavigationBar;
