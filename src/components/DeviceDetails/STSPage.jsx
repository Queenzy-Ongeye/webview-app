import React from 'react';
import DataDisplay from './DataDisplay';

const STSPage = ({ data }) => {
  return (
    <div className="data-tab">
      <h2>STS Data</h2>
      {data.map((item, index) => (
        <DataDisplay
          key={index}
          title={item.name}
          value={item.realVal}
          description={item.desc}
        />
      ))}
    </div>
  );
};

export default STSPage;
