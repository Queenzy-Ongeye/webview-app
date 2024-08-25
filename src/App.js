import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./service/store";
import Home from "./Home";
import AttPage from "./components/DeviceDetails/ATTPage";
import StsPage from "./components/DeviceDetails/STSPage";
import CMDPage from "./components/DeviceDetails/CMDPage";
import DTAPage from "./components/DeviceDetails/DTAPage";
import DIAPage from "./components/DeviceDetails/DIAPage";
import ScanData from "./components/scanQr-Barcode/ScanData";
import NavigationBar from "./components/NavBar"; // Ensure correct import path

const App = () => {
  return (
    <StoreProvider>
      <Router>
        <div className="min-h-screen flex">
          <NavigationBar />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/att" element={<AttPage />} />
              <Route path="/cmd" element={<CMDPage />} />
              <Route path="/sts" element={<StsPage />} />
              <Route path="/dta" element={<DTAPage />} />
              <Route path="/dia" element={<DIAPage />} />
              <Route path="/scan-data" element={<ScanData />} />
            </Routes>
          </div>
        </div>
        <footer className="bg-gray-800 text-white py-4 text-center">
          &copy; 2024 Omnivoltaic Energy Solutions. All rights reserved.
        </footer>
      </Router>
    </StoreProvider>
  );
};

export default App;
