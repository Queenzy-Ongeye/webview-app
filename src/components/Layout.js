import React from "react";
import { NavigationBar } from "./NavBar";
import BottomNav from "./BleButtons/BottomNav";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Include NavigationBar at the top */}
      <NavigationBar />

      {/* Main content area */}
      <main className="flex-grow p-4">{children}</main>

      {/* Include BottomNav at the bottom */}
      <BottomNav />
    </div>
  );
};

export default Layout;
