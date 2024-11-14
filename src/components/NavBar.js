import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCloud, FaHome, FaQrcode } from "react-icons/fa"; // Import cloud icons
import ThemeToggle from "./ThemeToggle";
import { useThemeProvider } from "../utility/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoCloudOffline } from "react-icons/go";
import { connectMqtt } from "../service/javascriptBridge";

const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme } = useThemeProvider(); // Get current theme
  const [isConnected, setIsConnected] = useState(false); // MQTT connection status

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // MQTT Connection
  useEffect(() => {
    const handleMqttConnection = () => {
      connectMqtt();
      setIsConnected(true);
    };
    handleMqttConnection();
  }, []);

  return (
    <div>
      {/* Top Navbar */}
      <div
        className={`fixed top-0 left-0 w-full h-12 flex items-center justify-between px-4 ${
          currentTheme === "dark"
            ? "bg-gray-900 text-white"
            : "bg-oves-blue text-white"
        } z-50`}
      >
        {/* Cloud Icon for MQTT Status */}
        <div className="flex items-center space-x-4">
          {/* Hamburger Menu Button for Mobile */}
          <button
            className={`${
              currentTheme === "dark"
                ? "text-white bg-gray-900"
                : "text-white bg-oves-blue"
            } px-2 focus:outline-none lg:hidden`}
            onClick={toggleMenu}
          >
            ☰
          </button>
        </div>

        {/* Cloud Icon for MQTT Status at the end of the Navbar */}
        <div className={`text-white ${isConnected ? "text-green-500" : "text-gray-500"}`}>
          {isConnected ? <FaCloud /> : <GoCloudOffline />}
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
          currentTheme === "dark" ? "bg-gray-900" : "bg-oves-blue"
        } text-white w-62 min-h-screen py-8 fixed top-12 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 flex flex-col justify-between lg:top-0 lg:w-64`}
      >
        {/* Navigation Links */}
        <div className="flex-grow">
          <Link
            to="/home"
            className="px-4 py-2 hover:bg-cyan-600 rounded my-2 flex items-center"
            onClick={closeMenu}
          >
            <FaHome className="mr-2" /> BLE Scanned Devices
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
