import React, { Suspense, lazy, useEffect, useState } from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./service/store";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ThemeProvider from "./utility/ThemeContext";
import Layout from "./components/Layout"; // Import Layout Component

// Lazy load the components
const Home = lazy(() => import("./components/home/Home"));
const AttPage = lazy(() => import("./components/DeviceDetails/ATTPage"));
const StsPage = lazy(() => import("./components/DeviceDetails/STSPage"));
const CMDPage = lazy(() => import("./components/DeviceDetails/CMDPage"));
const DTAPage = lazy(() => import("./components/DeviceDetails/DTAPage"));
const DIAPage = lazy(() => import("./components/DeviceDetails/DIAPage"));
const ScanData = lazy(() => import("./components/scanQr-Barcode/ScanDataPage"));
const Header = lazy(() => import("./components/Header/Header")); // Lazy load Header
const Login = lazy(() => import("./components/auth/loginPage"));
const BlePage = lazy(() => import("./components/BleButtons/BlePage"))


const App = () => {
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  // useEffect(() => {
  //   const authStatus = Boolean(localStorage.getItem(isAuthenticated));
  //   setIsAuthenticated(authStatus);
  // }, [])
  return (
    <StoreProvider>
      <Router>
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element = {<Login />}/>
            {/* Use Layout for all routes to ensure NavigationBar is included */}
            <Route
              path="/home"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            <Route
              path="/att"
              element={
                <Layout>
                  <AttPage />
                </Layout>
              }
            />
            <Route
              path="/cmd"
              element={
                <Layout>
                  <CMDPage />
                </Layout>
              }
            />
            <Route
              path="/sts"
              element={
                <Layout>
                  <StsPage />
                </Layout>
              }
            />
            <Route
              path="/dta"
              element={
                <Layout>
                  <DTAPage />
                </Layout>
              }
            />
            <Route
              path="/dia"
              element={
                <Layout>
                  <DIAPage />
                </Layout>
              }
            />
            <Route
              path="/ble"
              element={
                <Layout>
                  <BlePage/>
                </Layout>
              }
            />
            <Route
              path="/scan-data"
              element={
                <Layout>
                  <ScanData />
                </Layout>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </StoreProvider>
  );
};

export default App;
