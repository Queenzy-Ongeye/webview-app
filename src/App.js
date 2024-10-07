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

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authStatus = Boolean(
        window.localStorage?.getItem("isAuthenticated")
      );
      setIsAuthenticated(authStatus);
    }
  }, []);
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
          <ThemeProvider>
            <Routes>
              {/* Default route renders Login component */}
              <Route
                path="/"
                element={<Login setIsAuthenticated={setIsAuthenticated} />}
              />

              {/* Protected Route: Redirects to /home on successful login */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <Layout>
                      <Header /> {/* Display Header component */}
                      <Home /> {/* Display Home component below Header */}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Other routes */}
              <Route
                path="/att"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <Layout>
                      <Header />
                      <AttPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cmd"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <Layout>
                      <Header />
                      <CMDPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Add more routes as needed */}

              {/* Catch-all route: Redirect to login if route is not found */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ThemeProvider>
        </Suspense>
      </Router>
    </StoreProvider>
  );
};

// ProtectedRoute component to restrict access to authenticated users only
const ProtectedRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default App;
