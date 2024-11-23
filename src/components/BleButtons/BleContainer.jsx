import React, { useState } from 'react';
import { useStore } from '../../service/store';
import BleButtons from './BleButtons';
import BleDataPage from './BleDataPage';

const BleContainer = () => {
  const { state } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="relative w-full h-full min-h-screen">
      <div className={`absolute inset-0 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <BleDataPage />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <BleButtons setIsLoading={setIsLoading} />
      </div>
    </div>
  );
};

export default BleContainer;
