import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaHome, FaQrcode, FaUser, FaSearch } from "react-icons/fa"; // Import icons
import ThemeToggle from "./ThemeToggle";
import { useThemeProvider } from "../utility/ThemeContext";

const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme } = useThemeProvider(); // Get current theme

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div>
      {/* Top Navbar */}
      <div
        className={`fixed top-0 left-0 w-full h-12 flex items-center justify-between px-4 ${
          currentTheme === "dark"
            ? "bg-gray-900 text-white"
            : "bg-blue-950 text-white"
        } z-50`}
      >
        {/* App Title or Logo */}
        <div className="font-bold text-lg">BLE Scanner App</div>

        {/* Icons on the Top Right */}
        <div className="flex items-center space-x-4">
          <FaSearch className="cursor-pointer hover:text-gray-300" />
          <FaUser className="cursor-pointer hover:text-gray-300" />
          {/* Hamburger Menu Button for Mobile */}
          <button
            className={`${
              currentTheme === "dark"
                ? "text-white bg-gray-900"
                : "text-white bg-blue-950"
            } px-2 focus:outline-none lg:hidden`}
            onClick={toggleMenu}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Overlay to close the menu when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={toggleMenu}
        ></div>
      )}

      {/* Side Navigation Menu */}
      <nav
        className={`${
          currentTheme === "dark" ? "bg-gray-900" : "bg-blue-950"
        } text-white w-62 min-h-screen py-8 fixed top-12 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 flex flex-col justify-between lg:top-0 lg:w-64`}
      >
        {/* Navigation Links */}
        <div className="flex-grow">
          <Link
            to="/Header"
            className="px-4 py-2 hover:bg-cyan-600 rounded my-2 flex items-center"
            onClick={closeMenu}
          >
            <FaHome className="mr-2" /> Home
          </Link>
          <Link
            to="/scan-data"
            className="px-4 py-2 hover:bg-cyan-600 rounded my-2 flex items-center"
            onClick={closeMenu}
          >
            <FaQrcode className="mr-2" /> QR Code Scan
          </Link>
        </div>

        {/* Theme Toggle at the Bottom */}
        <hr className="bg-white" />
        <div className="px-4 rounded my-2">
          <p className="text-gray-400 font-thin font-mono my-2 ml-0.1 flex-1">
            Theme
          </p>
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
};

export default NavigationBar;
