import React, { Suspense, lazy, useEffect, useState } from "react";
import { HashRouter as Router, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { StoreProvider } from "./service/store";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ThemeProvider from "./utility/ThemeContext";
import Layout from "./components/Layout"; // Import Layout Component
import { UserProvider } from "./components/profile/userContex";
import { AuthProvider } from "./components/auth/authContext";

// Lazy load the components
const Home = lazy(() => import("./components/home/Home"));
const ScanData = lazy(() => import("./components/scanQr-Barcode/ScanDataPage"));
const Login = lazy(() => import("./components/auth/loginPage"));
const DeviceData = lazy(() =>
  import("./components/scanQr-Barcode/DeviceDataPage")
);
const Profile = lazy(() => import("./components/profile/ProfilePage"));
const EditProfile = lazy(() => import("./components/profile/EditProfilePage"));
const BleData = lazy(() => import("./components/BleButtons/BleDataPage"));
const BleContainer = lazy(() => import("./components/BleButtons/BleContainer"));
const LocationTracker = lazy(() => import("./components/locationTracker/LocationTracker"))

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = true; // Replace with your actual authentication logic
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => {
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  // useEffect(() => {
  //   const authStatus = Boolean(localStorage.getItem(isAuthenticated));
  //   setIsAuthenticated(authStatus);
  // }, [])
  return (
    <AuthProvider>
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
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Home />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scan-data"
                  element={
                    <ProtectedRoute>
                    <Layout>
                      <LocationTracker />
                    </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/device-data"
                  element={
                    <ProtectedRoute>
                    <Layout>
                      <DeviceData />
                    </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-profile"
                  element={
                  <ProtectedRoute>
                    <Layout>
                      <EditProfile />
                    </Layout>
                  </ProtectedRoute>
                  }
                />
                <Route
                  path="/ble-data"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <BleData />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ble-container"
                  element={
                  <ProtectedRoute>
                    <Layout>
                      <BleContainer />
                    </Layout>
                  </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </StoreProvider>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;
