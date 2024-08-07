import React from 'react';
import DataDisplay from './DataDisplay';

const CMDPage = ({ data }) => {
  return (
    <div className="data-tab">
      <h2>CMD Data</h2>
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

export default CMDPage;
