import React, { useState, useContext } from "react";
import { UserContext } from "./userContex";

const ProfilePage = () => {
  const { user, setUser } = useContext(UserContext); // Access logged-in user and updater
  const [isEditing, setIsEditing] = useState(false); // Track if editing mode is active
  const [theme, setTheme] = useState("light"); // Track theme
  const [profileDetails, setProfileDetails] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileDetails((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = () => {
    setUser(profileDetails); // Update user context
    setIsEditing(false);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    document.documentElement.classList.toggle("dark"); // Add Tailwind's dark mode class
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center p-6 ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {/* Profile Header */}
      <header className="w-full max-w-sm bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-md p-6 text-center">
        <img
          src="https://via.placeholder.com/100"
          alt="Profile"
          className="w-24 h-24 mx-auto rounded-full mb-4"
        />
        {!isEditing ? (
          <>
            <h1 className="text-xl font-semibold">
              {profileDetails.name || "Guest"}
            </h1>
            <p className="text-sm">{profileDetails.email}</p>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              name="name"
              value={profileDetails.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
              className="w-full mt-2 p-2 border rounded-md"
            />
            <input
              type="email"
              name="email"
              value={profileDetails.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="w-full mt-2 p-2 border rounded-md"
            />
            <div className="flex justify-around mt-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                onClick={saveProfile}
              >
                Save
              </button>
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </header>

      {/* Settings */}
      <section className="w-full max-w-sm mt-6 space-y-4">
        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-md p-4 flex justify-between items-center">
          <div>
            <h3 className="text-gray-800 dark:text-gray-100 font-semibold">
              Theme
            </h3>
            <p className="text-sm">Switch between light and dark mode</p>
          </div>
          <button
            className="text-blue-600 hover:underline"
            onClick={toggleTheme}
          >
            Toggle
          </button>
        </div>
      </section>

      {/* Logout */}
      <button className="mt-6 w-full max-w-sm bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700">
        Logout
      </button>
    </div>
  );
};

export default ProfilePage;
