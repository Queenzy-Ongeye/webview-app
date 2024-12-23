import React, { useState } from "react";
import BottomNav from "./BleButtons/BottomNav";
import NavigationBar from "./Header/NavBar";
import Header from "./Header/SideBar";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden max-w-9xl bg-white dark:bg-gray-800">
      {/* Sidebar */}
      <NavigationBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      {/* Main content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-0 sm:px-4 lg:px-4 py-2 w-full max-w-9xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Include BottomNav at the bottom */}
      {/* <BottomNav /> */}
    </div>
  );
};

export default Layout;
