import React, { Suspense, lazy } from "react";
import {
  HashRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { StoreProvider } from "./service/store";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ThemeProvider from "./utility/ThemeContext";
import Layout from "./components/Layout";
import { UserProvider } from "./components/profile/userContex";

// Lazy load the components
const Home = lazy(() => import("./components/home/Home"));
const AttPage = lazy(() => import("./components/DeviceDetails/ATTPage"));
const StsPage = lazy(() => import("./components/DeviceDetails/STSPage"));
const CMDPage = lazy(() => import("./components/DeviceDetails/CMDPage"));
const DTAPage = lazy(() => import("./components/DeviceDetails/DTAPage"));
const DIAPage = lazy(() => import("./components/DeviceDetails/DIAPage"));
const ScanData = lazy(() => import("./components/scanQr-Barcode/ScanDataPage"));
const Login = lazy(() => import("./components/auth/loginPage"));
const BlePage = lazy(() => import("./components/BleButtons/BlePage"));
const DeviceData = lazy(() =>
  import("./components/scanQr-Barcode/DeviceDataPage")
);
const Profile = lazy(() => import("./components/profile/ProfilePage"));
const EditProfile = lazy(() => import("./components/profile/EditProfilePage"));
const BleData = lazy(() => import("./components/BleButtons/BleDataPage"));
const BleContainer = lazy(() => import("./components/BleButtons/BleContainer"));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (!isLoggedIn) {
    // Redirect to login and preserve the current location in `state.from`
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Layout>{children}</Layout>;
};
const App = () => {
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

              {/* Protected Routes */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/att"
                element={
                  <ProtectedRoute>
                    <AttPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cmd"
                element={
                  <ProtectedRoute>
                    <CMDPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sts"
                element={
                  <ProtectedRoute>
                    <StsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dta"
                element={
                  <ProtectedRoute>
                    <DTAPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dia"
                element={
                  <ProtectedRoute>
                    <DIAPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ble"
                element={
                  <ProtectedRoute>
                    <BlePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scan-data"
                element={
                  <ProtectedRoute>
                    <ScanData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/device-data"
                element={
                  <ProtectedRoute>
                    <DeviceData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-profile"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ble-data"
                element={
                  <ProtectedRoute>
                    <BleData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ble-container"
                element={
                  <ProtectedRoute>
                    <BleContainer />
                  </ProtectedRoute>
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
