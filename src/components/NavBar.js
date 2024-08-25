import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* Hamburger Menu Button */}
      <button
        className="text-white bg-cyan-700 px-4 py-2 focus:outline-none fixed top-4 left-4 z-50"
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
        className={`bg-cyan-700 text-white w-64 min-h-screen py-8 fixed top-0 left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex flex-col justify-around">
          <Link to="/" className="px-4 py-2 hover:bg-cyan-600 rounded my-2">
            Home
          </Link>
          <Link to="/scan-data" className="px-4 py-2 hover:bg-cyan-600 rounded my-2">
            QR Code Scan
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default NavigationBar;
