// src/components/AttPage.js
import React from 'react';
import { useLocation } from 'react-router-dom';

const AttPage = () => {
  const location = useLocation();
  const { data } = location.state || {};

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">ATT Page</h2>
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default AttPage;
