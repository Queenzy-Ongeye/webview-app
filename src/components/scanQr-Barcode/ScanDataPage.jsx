import React from "react";
import { useStore } from "../../service/store";
import { useLocation } from "react-router-dom";

const ScanDataPage = () => {
  const location = useLocation();
  const { scannedData } = location.state || {};

  // Assuming scannedData is an object with product details
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1>Scanned Product Details</h1>
      {scannedData ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="text-left py-2 px-4 font-semibold">Property</th>
                <th className="text-left py-2 px-4 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-t">Device Name</td>
                <td className="py-2 px-4 border-t">Oves E-3P 00016</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-t">Description</td>
                <td className="py-2 px-4 border-t">
                  {"No description available"}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-t">Price</td>
                <td className="py-2 px-4 border-t">
                  {scannedData.value || "Not available"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p>No product data available.</p>
      )}
    </div>
  );
};

export default ScanDataPage;
