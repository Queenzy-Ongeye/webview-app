// src/components/BottomNav.js
import React, { useState } from "react";
import { FaHome, FaQrcode, FaUserAlt } from "react-icons/fa";

const BottomNav = () => {
  const [active, setActive] = useState("home"); // Track active button

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg shadow-xl rounded-t-3xl z-10 animate-fadeIn">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Home Button */}
        <NavItem
          icon={<FaHome />}
          label="Home"
          active={active === "home"}
          onClick={() => setActive("home")}
        />
        {/* Scan QR Code Button */}
        <NavItem
          icon={<FaQrcode />}
          label="Scan QR"
          active={active === "scanqr"}
          onClick={() => setActive("scanqr")}
        />
        {/* User Profile Button */}
        <NavItem
          icon={<FaUserAlt />}
          label="Profile"
          active={active === "profile"}
          onClick={() => setActive("profile")}
        />
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center group cursor-pointer transition-transform duration-300 ease-in-out ${
        active ? "text-blue-500" : "text-gray-600"
      }`}
    >
      {/* Ripple Effect */}
      <span className="absolute inset-0 w-full h-full rounded-full bg-blue-500 opacity-0 group-active:opacity-30 transition duration-300"></span>

      {/* Icon with Glow/Shadow */}
      <div
        className={`text-2xl group-hover:text-blue-500 transition duration-300 ease-in-out transform group-hover:scale-110 ${
          active ? "scale-110 shadow-lg text-blue-500" : ""
        }`}
      >
        {icon}
      </div>

      {/* Label */}
      <span
        className={`text-xs mt-1 transition duration-300 ease-in-out ${
          active ? "text-blue-500" : "text-gray-600 group-hover:text-blue-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export default BottomNav;
