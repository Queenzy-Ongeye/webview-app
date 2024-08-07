import React from "react";
import "./index.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { StoreProvider } from "./service/store";
import Home from "./Home";
import ATTPage from "./components/DeviceDetails/ATTPage";
import CMDPage from "./components/DeviceDetails/CMDPage";
import STSPage from "./components/DeviceDetails/STSPage";
import DTAPage from "./components/DeviceDetails/DTAPage";
import DIAPage from "./components/DeviceDetails/DIAPage";

const App = () => {
  return (
    <StoreProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <nav className="bg-blue-600 text-white py-4">
            <div className="container mx-auto flex justify-between items-center">
              <Link to="/" className="text-lg font-semibold">
                Home
              </Link>
              {/* <Link to="/table" className="text-lg font-semibold">
                Data Table
              </Link> */}
            </div>
          </nav>
          <main className="flex-grow container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/att" element={<ATTPage />} />
              <Route path="/cmd" element={<CMDPage />} />
              <Route path="/sts" element={<STSPage />} />
              <Route path="/dta" element={<DTAPage />} />
              <Route path="/dia" element={<DIAPage />} />
            </Routes>
          </main>
          <footer className="bg-gray-800 text-white py-4 text-center">
            &copy; 2024 Omnivoltaic Energy Solutions. All rights reserved.
          </footer>
        </div>
      </Router>
    </StoreProvider>
  );
};

export default App;
