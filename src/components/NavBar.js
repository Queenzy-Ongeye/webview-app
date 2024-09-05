import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaHome, FaQrcode } from "react-icons/fa"; // Import the icons
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
      {/* Hamburger Menu Button */}
      <button
        className={`${
          currentTheme === "dark"
            ? "text-white bg-gray-900"
            : "text-white bg-cyan-700"
        } px-2 my-2 ml-2 focus:outline-none fixed top-0 left-0 z-50 lg:px-4 lg:py-4 lg:mt-6 lg:ml-6`}
        onClick={toggleMenu}
      >
        ☰
      </button>

      {/* Overlay to close the menu when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={toggleMenu}
        ></div>
      )}

      {/* Navigation Menu */}
      <nav
        className={`${
          currentTheme === "dark" ? "bg-gray-900" : "bg-cyan-700"
        } text-white w-62 min-h-screen py-8 fixed top-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 flex flex-col justify-between`}
      >
        <div className="flex-grow">
          <div className="px-4 py-2 rounded my-2">
            <h1>BLE Scanner App</h1>
          </div>
          <hr className="bg-white" />

          {/* Navigation Links with Icons */}
          <Link
            to="/"
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
          <p className="text-gray-400 font-thin font-mono my-2 ml-0.1 flex-1">Theme</p>
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
};

export default NavigationBar;
