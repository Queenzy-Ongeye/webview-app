import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

// Define the prop types for type safety and clarity
interface BleDevice {
  name?: string;
  macAddress: string;
  rssi: number;
}

interface BleConnectionProps {
  detectedDevices: BleDevice[];
  connectToBluetoothDevice: (macAddress: string) => Promise<void>;
  initBleData: (macAddress: string) => Promise<{ dataList?: any[] }>;
  isLoading?: boolean;
}

const BleDeviceConnection: React.FC<BleConnectionProps> = ({
  detectedDevices,
  connectToBluetoothDevice,
  initBleData,
  isLoading = false
}) => {
  const [connectingMacAddress, setConnectingMacAddress] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<Map<string, boolean>>(new Map());

  // Create a Map to ensure uniqueness based on MAC Address
  const uniqueDevicesMap = new Map<string, BleDevice>();
  detectedDevices.forEach((device) => {
    uniqueDevicesMap.set(device.macAddress, device);
  });

  // Convert the Map to an array and sort by signal strength (RSSI)
  const uniqueDevices = Array.from(uniqueDevicesMap.values()).sort(
    (a, b) => b.rssi - a.rssi
  );

  const handleConnectAndInit = async (macAddress: string) => {
    setLoadingMap((prevMap) => new Map(prevMap.set(macAddress, true)));
    setConnectingMacAddress(macAddress);

    try {
      console.log("Connecting to Bluetooth device", macAddress);
      await connectToBluetoothDevice(macAddress);

      setTimeout(async () => {
        console.log("Starting BLE data initialization after delay");
        const response = await initBleData(macAddress);
        console.log("Initialized BLE data:", response);

        // You can add navigation or further processing here
      }, 25000);
    } catch (error) {
      console.error("Connection error:", error);
      alert("Failed to connect. Please try again.");
    } finally {
      setTimeout(() => {
        setConnectingMacAddress(null);
        setLoadingMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(macAddress, false);
          return newMap;
        });
      }, 80000);
    }
  };

  // Helper function to get WiFi icon based on signal strength
  const getWiFiIcon = (rssi: number) => {
    if (rssi > -50) return <Wifi className="text-green-500" />;
    if (rssi > -70) return <Wifi className="text-yellow-500" />;
    return <WifiOff className="text-red-500" />;
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Detected BLE Devices</CardTitle>
          <CardDescription>
            {uniqueDevices.length > 0
              ? `${uniqueDevices.length} device${
                  uniqueDevices.length > 1 ? "s" : ""
                } found`
              : "No BLE devices detected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <AnimatePresence>
              {uniqueDevices.map((device, index) => (
                <motion.div
                  key={device.macAddress}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="mb-2">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {device.name || "Unknown Device"}
                      </CardTitle>
                      <CardDescription>{device.macAddress}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-left space-x-2">
                        {getWiFiIcon(device.rssi)}
                        <span className="text-sm text-gray-500">
                          Signal Strength: {device.rssi}dB
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => handleConnectAndInit(device.macAddress)}
                        disabled={loadingMap.get(device.macAddress) || isLoading}
                        className="w-full"
                      >
                        {loadingMap.get(device.macAddress) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Connecting to device...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BleDeviceConnection;