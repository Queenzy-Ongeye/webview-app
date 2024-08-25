import React from "react";
import { useStore } from "../../service/store";

const ScanData = () => {
  const { state } = useStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {state.productData ? (
        <div className="product-details bg-white p-4 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4">Product Details</h2>
          <p>
            <strong>Name:</strong> {state.productData.name}
          </p>
          <p>
            <strong>Description:</strong> {state.productData.description}
          </p>
          {/* Add other product details as needed */}
        </div>
      ) : (
        <p>No product data available. Please scan a barcode or QR code.</p>
      )}
    </div>
  );
};

export default ScanData;
