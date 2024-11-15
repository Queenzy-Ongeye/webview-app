import React, { useState, useContext } from "react";
import { UserContext } from "./userContex";
import { FiLogOut, FiChevronRight } from "react-icons/fi";
import { IoStorefrontOutline } from "react-icons/io5";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FaLock } from "react-icons/fa";
import { MdSupport } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

const ProfilePage = () => {
  const { user, setUser } = useContext(UserContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);

  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  const handleEditPage = (e) => {
    navigate("/edit-profile");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      {/* Profile Header */}
      <div className="w-full max-w-sm text-center mb-6">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src="/images/logo-white.png"
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto object-cover"
          />
        </div>
        <h1 className="text-xl font-semibold">{"Guest"}</h1>
        <button
          className="mt-4 bg-black text-white px-6 py-2 rounded-full"
          onClick={handleEditPage}
        >
          Edit Profile
        </button>
      </div>

      {/* Inventories Section */}
      <div className="w-full max-w-sm bg-gray-100 rounded-lg mb-4">
        <h3 className="text-gray-500 text-sm font-semibold px-4 py-2">
          Inventories
        </h3>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <MdSupport className="text-gray-600" size={20} />
            <span>Support</span>
          </div>
          <FiChevronRight className="text-gray-400" />
        </div>
      </div>

      {/* Preferences Section */}
      <div className="w-full max-w-sm bg-gray-100 rounded-lg mb-4">
        <h3 className="text-gray-500 text-sm font-semibold px-4 py-2">
          Preferences
        </h3>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <IoMdNotificationsOutline className="text-gray-600" size={20} />
            <span>Push notifications</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              className="sr-only"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500">
              <div
                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                  notificationsEnabled ? "transform translate-x-5" : ""
                }`}
              ></div>
            </div>
          </label>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <FaLock className="text-gray-600" size={20} />
            <span>Face ID</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={faceIdEnabled}
              onChange={() => setFaceIdEnabled(!faceIdEnabled)}
              className="sr-only"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500">
              <div
                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                  faceIdEnabled ? "transform translate-x-5" : ""
                }`}
              ></div>
            </div>
          </label>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <FaLock className="text-gray-600" size={20} />
            <span>PIN Code</span>
          </div>
          <FiChevronRight className="text-gray-400" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <p className="text-sm">Change Theme</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="w-full max-w-sm bg-gray-100 rounded-lg mb-4">
        <div
          onClick={handleLogout}
          className="flex items-center px-4 py-3 cursor-pointer space-x-3 text-red-600 hover:bg-gray-200 rounded-lg"
        >
          <div className="bg-red-100 p-2 rounded-lg">
            <FiLogOut size={20} className="text-red-600" />
          </div>
          <span className="font-semibold">Logout</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
