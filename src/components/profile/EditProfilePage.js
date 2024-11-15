import React, { useState, useContext } from "react";
import { IoIosArrowBack } from "react-icons/io"; // Icon for back arrow
import { FiEdit2 } from "react-icons/fi"; // Icon for edit overlay
import { UserContext } from "./userContex";
import { useNavigate } from "react-router-dom";

const EditProfilePage = () => {
  const { user, setUser } = useContext(UserContext);
  const [profileDetails, setProfileDetails] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    distributor: user?.distributor || "",
    country: user?.country || "",
  });
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileDetails((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = () => {
    setUser(profileDetails);
    alert("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 mt-6">
      {/* Header with back icon */}
      <div className="w-full max-w-sm flex items-center mb-4">
        <button className="text-gray-600 text-xl" onClick={handleBack}>
          <IoIosArrowBack />
        </button>
        <h1 className="ml-4 text-xl font-semibold">Edit Profile</h1>
      </div>

      {/* Profile picture with edit overlay */}
      <div className="relative mb-6">
        <img
          src="/images/logo-white.png"
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover"
        />
        <button className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-white">
          <FiEdit2 />
        </button>
      </div>

      {/* Editable Profile Form */}
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="text-gray-600 text-sm">Name</label>
          <input
            type="text"
            name="name"
            value={profileDetails.name}
            onChange={handleInputChange}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="text-gray-600 text-sm">Email Address</label>
          <div className="flex items-center space-x-2">
            <input
              type="email"
              name="email"
              value={profileDetails.email}
              onChange={handleInputChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              placeholder="Enter your email"
              disabled // Disable email editing if verified
            />
            <span className="bg-blue-100 text-blue-500 text-xs font-semibold px-2 py-1 rounded-full">
              Verified
            </span>
          </div>
        </div>

        <div>
          <label className="text-gray-600 text-sm">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={profileDetails.phone}
            onChange={handleInputChange}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="text-gray-600 text-sm">Distributor</label>
          <input
            type="text"
            name="distributor"
            value={profileDetails.distributor}
            onChange={handleInputChange}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            placeholder="oves.ke"
          />
        </div>

        <div>
          <label className="text-gray-600 text-sm">Country</label>
          <input
            type="text"
            name="country"
            value={profileDetails.country}
            onChange={handleInputChange}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            placeholder="Select your country"
          />
        </div>
      </div>

      {/* Save Changes Button */}
      <button
        onClick={saveProfile}
        className="w-full max-w-sm mt-6 bg-oves-blue text-white py-3 rounded-lg shadow-md text-center"
      >
        Save Changes
      </button>
    </div>
  );
};

export default EditProfilePage;
