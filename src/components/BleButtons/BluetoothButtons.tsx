import React, { useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../../service/store";
import { IBleStateProps } from "../../utility/types";

interface TimerState {
  connectStart: number | null;
  connectEnd: number | null;
  initStart: number | null;
  initEnd: number | null;
}

const BluetoothButton: React.FC<IBleStateProps> = ({
  macAddress,
  connectToBluetoothDevice,
  initBleData,
  searchForMatch,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'idle' | 'connecting' | 'initializing'>('idle');
  const [timers, setTimers] = useState<TimerState>({
    connectStart: null,
    connectEnd: null,
    initStart: null,
    initEnd: null,
  });
  const { dispatch } = useStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setElapsedTime(0);
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setCurrentStep('connecting');

    // Reset timers
    setTimers({
      connectStart: null,
      connectEnd: null,
      initStart: null,
      initEnd: null,
    });

    try {
      setLoading(true);
      
      // Start connection timer
      const connectStartTime = Date.now();
      setTimers(prev => ({ ...prev, connectStart: connectStartTime }));
      startTimer();

      // Step 1: Connect to device
      const connectionSuccess = await connectToBluetoothDevice(macAddress);
      
      // Record connection end time
      const connectEndTime = Date.now();
      setTimers(prev => ({ ...prev, connectEnd: connectEndTime }));

      if (!connectionSuccess) {
        throw new Error("Failed to connect to device");
      }

      // Start initialization timer
      setCurrentStep('initializing');
      const initStartTime = Date.now();
      setTimers(prev => ({ ...prev, initStart: initStartTime }));

      // Step 2: Initialize BLE data
      const initSuccessResponse = await initBleData(macAddress);
      
      // Record initialization end time
      const initEndTime = Date.now();
      setTimers(prev => ({ ...prev, initEnd: initEndTime }));

      if (!initSuccessResponse) {
        throw new Error("Failed to initialize BLE data");
      }

      // Update state with successful initialization
      dispatch({
        type: "SET_INIT_BLE_DATA_RESPONSE",
        payload: initSuccessResponse,
      });

      // Trigger search after successful initialization
      searchForMatch();
      
    } catch (error: any) {
      console.error("Error in Bluetooth connection flow:", error);
      setError(error.message);
    } finally {
      stopTimer();
      setLoading(false);
      setCurrentStep('idle');
    }
  };

  const getStatusText = () => {
    if (loading) {
      if (currentStep === 'connecting') {
        return `Connecting... (${formatTime(elapsedTime)})`;
      }
      if (currentStep === 'initializing') {
        return `Initializing... (${formatTime(elapsedTime)})`;
      }
    }
    return "Connect Device";
  };

  const getTimingDetails = () => {
    const { connectStart, connectEnd, initStart, initEnd } = timers;
    
    const connectTime = connectStart && connectEnd 
      ? ((connectEnd - connectStart) / 1000).toFixed(1) 
      : null;
      
    const initTime = initStart && initEnd 
      ? ((initEnd - initStart) / 1000).toFixed(1) 
      : null;
      
    const totalTime = connectStart && initEnd 
      ? ((initEnd - connectStart) / 1000).toFixed(1) 
      : null;

    return { connectTime, initTime, totalTime };
  };

  const { connectTime, initTime, totalTime } = getTimingDetails();

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          flex items-center justify-center gap-2 px-4 py-2 rounded
          ${loading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-oves-blue hover:bg-oves-blue"}
          text-white font-medium transition-colors
          ${error ? "border-2 border-red-500" : ""}
        `}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {getStatusText()}
      </button>

      {/* Timing Information */}
      {(connectTime || initTime || totalTime) && (
        <div className="text-sm text-gray-600 space-y-1">
          {connectTime && (
            <div>Connection time: {connectTime}s</div>
          )}
          {initTime && (
            <div>Initialization time: {initTime}s</div>
          )}
          {totalTime && (
            <div className="font-medium">
              Total time: {totalTime}s
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-500 text-sm mt-1 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default BluetoothButton;