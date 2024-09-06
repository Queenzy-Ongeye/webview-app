import React, { Suspense, lazy } from "react";
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { StoreProvider } from "./service/store";
import NavigationBar from "./components/NavBar";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ThemeProvider from "./utility/ThemeContext"; // Import ThemeProvider

const Home = lazy(() => import("./Home"));
const AttPage = lazy(() => import("./components/DeviceDetails/ATTPage"));
const StsPage = lazy(() => import("./components/DeviceDetails/STSPage"));
const CMDPage = lazy(() => import("./components/DeviceDetails/CMDPage"));
const DTAPage = lazy(() => import("./components/DeviceDetails/DTAPage"));
const DIAPage = lazy(() => import("./components/DeviceDetails/DIAPage"));
const ScanData = lazy(() => import("./components/scanQr-Barcode/ScanData"));

const App = () => {
  return (
    <StoreProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen flex">
            <NavigationBar />
            <div className="flex-grow">
              <Suspense
                fallback={
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/att" element={<AttPage />} />
                  <Route path="/cmd" element={<CMDPage />} />
                  <Route path="/sts" element={<StsPage />} />
                  <Route path="/dta" element={<DTAPage />} />
                  <Route path="/dia" element={<DIAPage />} />
                  <Route path="/scan-data" element={<ScanData />} />
                </Routes>
              </Suspense>
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </StoreProvider>
  );
};

export default App;
