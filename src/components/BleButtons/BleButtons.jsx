import React from "react";

const BleButtons = ({
  startBleScan,
  stopBleScan,
  toastMsg,
  bleData,
  isScanning,
  connectToBluetoothDevice,
  detectedDevices,
  startQrCode,
  jump2MainActivity
}) => {
  const [macAddress, setMacAddress] = useState("");
  const navigate = useNavigate();

  const handleViewClick = (deviceData) => {
    navigate(`/device-details/${deviceData.macAddress}`, { state: deviceData });
  };

  const columnsWithViewButton = [
    ...columnsData,
    {
      Header: "Actions",
      accessor: "actions",
      Cell: ({ row }) => (
        <button
          onClick={() => handleViewClick(row.original)}
          className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
        >
          View
        </button>
      ),
      sortType: "basic",
    },
  ];

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <button
        onClick={startBleScan}
        className={`px-4 py-2 rounded-md text-white ${
          isScanning ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
        } transition-colors duration-200`}
        disabled={isScanning}
      >
        {isScanning ? "Scanning..." : "Start BLE Scan"}
      </button>
      <button
        onClick={stopBleScan}
        className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
        disabled={!isScanning}
      >
        Stop BLE Scan
      </button>
      <button
        className="w-48 h-12 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
        onClick={toastMsg}
      >
        Show Toast Message
      </button>

      <div className="mt-4 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">
          Detected Bluetooth Devices
        </h3>
        <ul className="list-disc pl-5">
          {detectedDevices.map((device, index) => (
            <li key={index} onClick={() => setMacAddress(device.macAddress)}>
              {device.fullName} - {device.macAddress}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => connectToBluetoothDevice(macAddress)}
        className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
      >
        Connect to BLE Device
      </button>

      {/* Display detected devices */}
      <div className="mt-4 space-y-2">
        {detectedDevices.map((device, index) => (
          <div key={index} className="p-4 bg-white shadow-md rounded-lg">
            <p className="font-semibold">Device: {device.keyword}</p>
            <p>MAC Address: {device.macAddress}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BleButtons;
