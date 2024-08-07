import React from 'react';

const DataDisplay = ({ title, value, description }) => {
  return (
    <div className="data-display">
      <div className="data-display__title">{title}</div>
      <div className="data-display__value">{value}</div>
      <div className="data-display__description">{description}</div>
      <div className="data-display__action">READ</div>
    </div>
  );
};

export default DataDisplay;
