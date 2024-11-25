import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCloud, FaHome, FaQrcode } from "react-icons/fa";
import { GoCloudOffline } from "react-icons/go";
import ThemeToggle from "./ThemeToggle";
import { useThemeProvider } from "../utility/ThemeContext";
import { connectMqtt } from "../service/javascriptBridge";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme } = useThemeProvider();
  const [isConnected, setIsConnected] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // MQTT Connection
  useEffect(() => {
    const handleMqttConnection = async () => {
      try {
        connectMqtt(); // Initiates connection
        // Assume connectMqtt returns a promise or can confirm connection asynchronously
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect to MQTT:", error);
        setIsConnected(false);
      }
    };

    handleMqttConnection();
  }, []);

  return (
    <div className="relative">
      {/* Top Navbar */}
      <div
        className={`fixed top-0 left-0 w-full h-16 flex items-center justify-between px-4 ${
          currentTheme === "dark"
            ? "bg-gray-900 text-white"
            : "bg-oves-blue text-white"
        } z-50`}
      >
        {/* Hamburger Menu Button */}
        <button
          className={`${
            currentTheme === "dark"
              ? "text-white bg-gray-900"
              : "text-white bg-oves-blue"
          } p-2 focus:outline-none`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        {/* New Buttons */}
        <div className="flex items-center space-x-2">
          <Link
            to="/home"
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-white text-xs sm:text-sm"
          >
            Touch to Bind
          </Link>
          <Link
            to="/scan-data"
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-white text-xs sm:text-sm"
          >
            Scan to Bind
          </Link>
        </div>

        {/* Cloud Icon for MQTT Status */}
        <div className={`${isConnected ? "text-green-500" : "text-gray-500"}`}>
          {isConnected ? <FaCloud aria-label="Connected" /> : <GoCloudOffline aria-label="Disconnected" />}
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
        } text-white w-64 min-h-screen py-8 fixed top-16 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 flex flex-col justify-between`}
      >
        {/* Navigation Links */}
        <div className="flex-grow">
          <Link
            to="/home"
            className="px-4 py-2 hover:bg-cyan-600 rounded my-2 flex items-center"
            onClick={closeMenu}
          >
            <FaHome className="mr-2" aria-hidden="true" /> Touch to Bind
          </Link>
          <Link
            to="/scan-data"
            className="px-4 py-2 hover:bg-cyan-600 rounded my-2 flex items-center"
            onClick={closeMenu}
          >
            <FaQrcode className="mr-2" aria-hidden="true" /> Scan to Bind
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

      {/* Toast Container for notifications */}
      <ToastContainer />
    </div>
  );
};

export default NavigationBar;
