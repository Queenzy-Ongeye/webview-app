import React from "react";
import { BsQrCodeScan } from "react-icons/bs";
import { FaBluetooth } from "react-icons/fa";
import { IoMdBarcode } from "react-icons/io";
import { Link } from "react-router-dom";
import NavigationBar from "./NavBar";

const Header = () => {
  return (
    <div>
      <NavigationBar />
      {/* Add margin-top and padding for spacing */}
      <div className="mt-20 mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4 justify-center">
        {/* First card with specified width */}
        <div className="flex flex-col justify-between items-center p-4 bg-white shadow-lg rounded-lg border border-gray-300 transition-transform transform hover:scale-105 overflow-hidden w-48 h-48 mx-auto">
          <FaBluetooth size={64} className="text-blue-500 mt-8" />
          <h2 className="text-2xl font-semibold mb-4">
            <Link to="/home">BleScan</Link>
          </h2>
        </div>
        {/* Second card with specified width */}
        <div className="flex flex-col justify-between items-center p-4 bg-white shadow-lg rounded-lg border border-gray-300 transition-transform transform hover:scale-105 overflow-hidden w-48 h-48 mx-auto">
          <BsQrCodeScan size={64} className="text-blue-500 mt-8" />
          <h2 className="text-2xl font-semibold mb-4">
            <Link to="/scan-data">QRCode Scan</Link>
          </h2>
        </div>
        {/* Third card with specified width */}
        <div className="flex flex-col justify-between items-center p-4 bg-white shadow-lg rounded-lg border border-gray-300 transition-transform transform hover:scale-105 overflow-hidden w-48 h-48 mx-auto">
          <IoMdBarcode size={64} className="text-blue-500 mt-8" />
          <h2 className="text-2xl font-semibold mb-4">
            <Link to="/barcode-scan">Barcode Scan</Link>
          </h2>
        </div>
      </div>
    </div>
  );
};

export default Header;
