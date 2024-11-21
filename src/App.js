import React, { Suspense, lazy, useEffect, useState } from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./service/store";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ThemeProvider from "./utility/ThemeContext";
import Layout from "./components/Layout"; // Import Layout Component
import { UserProvider } from "./components/profile/userContex";

// Lazy load the components
const Home = lazy(() => import("./components/BleButtons/BleButtons"));
const AttPage = lazy(() => import("./components/DeviceDetails/ATTPage"));
const StsPage = lazy(() => import("./components/DeviceDetails/STSPage"));
const CMDPage = lazy(() => import("./components/DeviceDetails/CMDPage"));
const DTAPage = lazy(() => import("./components/DeviceDetails/DTAPage"));
const DIAPage = lazy(() => import("./components/DeviceDetails/DIAPage"));
const ScanData = lazy(() => import("./components/scanQr-Barcode/ScanDataPage"));
const Header = lazy(() => import("./components/Header/Header")); // Lazy load Header
const Login = lazy(() => import("./components/auth/loginPage"));
const BlePage = lazy(() => import("./components/BleButtons/BlePage"));
const DeviceData = lazy(() =>
  import("./components/scanQr-Barcode/DeviceDataPage")
);
const Profile = lazy(() => import("./components/profile/ProfilePage"));
const EditProfile = lazy(() => import("./components/profile/EditProfilePage"));
const BleData = lazy(() => import ("./components/BleButtons/BleDataPage"))

const App = () => {
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  // useEffect(() => {
  //   const authStatus = Boolean(localStorage.getItem(isAuthenticated));
  //   setIsAuthenticated(authStatus);
  // }, [])
  return (
    <UserProvider>
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
              <Route path="/" element={<Login />} />
              {/* Use Layout for all routes to ensure NavigationBar is included */}
              <Route
                path="/ble"
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
                    <BlePage />
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
              <Route
                path="/device-data"
                element={
                  <Layout>
                    <DeviceData />
                  </Layout>
                }
              />
              <Route
                path="/profile"
                element={
                  <Layout>
                    <Profile />
                  </Layout>
                }
              />
              <Route
                path="/edit-profile"
                element={
                  <Layout>
                    <EditProfile />
                  </Layout>
                }
              />
              <Route
                path="/ble-data"
                element={
                  <Layout>
                    <BleData />
                  </Layout>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </StoreProvider>
    </UserProvider>
  );
};

export default App;
