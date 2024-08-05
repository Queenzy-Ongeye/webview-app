import React from "react";
import "./index.css";
import TablePage from "./components/table/TablePage";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { StoreProvider } from "./service/store";
import Home from "./Home";

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
              <Link to="/table" className="text-lg font-semibold">
                Data Table
              </Link>
            </div>
          </nav>
          <main className="flex-grow container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/table" element={<TablePage />} />
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
