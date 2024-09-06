import React from "react";
import { useStore } from "../../service/store";
import { useLocation } from "react-router-dom";

const ScanData = () => {
  const location = useLocation();
  const { scannedData } = location.state || {};

  // Assuming scannedData is an object with product details
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1>Scanned Product Details</h1>
      {scannedData ? (
        <div>
          <p>
            <strong>Product Name:</strong>{" "}
            {scannedData.productName || "Unknown"}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {scannedData.description || "No description available"}
          </p>
          <p>
            <strong>Price:</strong> {scannedData.price || "Not available"}
          </p>
        </div>
      ) : (
        <p>No product data available.</p>
      )}
    </div>
  );
};

export default ScanData;
