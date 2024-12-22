import React from "react";
import { BsQrCodeScan } from "react-icons/bs";
import { FaBluetooth } from "react-icons/fa";
import { IoMdBarcode } from "react-icons/io";
import { Link } from "react-router-dom";
import NavigationBar from "./NavBar";
import BottomNav from "../BleButtons/BottomNav";

const Header = () => {
  return (
    <div>
      <NavigationBar />

      {/* Cards container with more spacing */}
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-1 gap-6 px-2 justify-center">
        {/* First card with solid background */}
        <div className="flex items-center p-2 bg-blue-100 shadow-xl rounded-xl transition-transform transform hover:scale-105 hover:shadow-2xl overflow-hidden w-80 h-24 mx-auto">
          <FaBluetooth size={48} className="text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-blue-600">
            <Link to="/home" className="hover:underline">
              BleScan
            </Link>
          </h2>
        </div>

        {/* Second card with solid background */}
        <div className="flex items-center p-2 bg-green-100 shadow-xl rounded-xl transition-transform transform hover:scale-105 hover:shadow-2xl overflow-hidden w-80 h-24 mx-auto">
          <BsQrCodeScan size={48} className="text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-green-600">
            <Link to="/scan-data" className="hover:underline">
              QRCode Scan
            </Link>
          </h2>
        </div>

        {/* Third card with solid background */}
        <div className="flex items-center p-2 bg-purple-100 shadow-xl rounded-xl transition-transform transform hover:scale-105 hover:shadow-2xl overflow-hidden w-80 h-24 mx-auto">
          <IoMdBarcode size={48} className="text-purple-600 mr-2" />
          <h2 className="text-lg font-semibold text-purple-600">
            <Link to="/barcode" className="hover:underline">
              Barcode Scan
            </Link>
          </h2>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Header;
