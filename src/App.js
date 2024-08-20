// src/App.js

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./service/store";
import Home from "./Home";
import AttPage from "./components/DeviceDetails/ATTPage";
import StsPage from "./components/DeviceDetails/STSPage";
import CMDPage from "./components/DeviceDetails/CMDPage";
import DTAPage from "./components/DeviceDetails/DTAPage";
import DIAPage from "./components/DeviceDetails/DIAPage";


const App = () => {
  return (
    <StoreProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/att" element={<AttPage />} />
            <Route path="/cmd" element={<CMDPage />} />
            <Route path="/sts" element={<StsPage />} />
            <Route path="/dta" element={<DTAPage />} />
            <Route path="/dia" element={<DIAPage />} />
          </Routes>
          <footer className="bg-gray-800 text-white py-4 text-center">
            &copy; 2024 Omnivoltaic Energy Solutions. All rights reserved.
          </footer>
        </div>
      </Router>
    </StoreProvider>
  );
};

export default App;
