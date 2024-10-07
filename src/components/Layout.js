import React from "react";
import Header from "./Header/Header";
import NavigationBar from "./NavBar";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Include Header */}
      <NavigationBar />
      {/* Render the children passed to Layout */}
      <main className="flex-grow p-4">{children}</main>
    </div>
  );
};

export default Layout;
