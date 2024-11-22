import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Info, Send } from 'lucide-react';
import { useStore } from "../../service/store";
import { toast } from "react-toastify";
import { Button } from "../reusableCards/Buttons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../reusableCards/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../reusableCards/dialog";
import { RadioGroup, RadioGroupItem } from "../reusableCards/radioButton";
import { Label } from "../reusableCards/lable";

const BleDataPage = () => {
  const { state } = useStore();
  const deviceData = state?.initBleData?.dataList || [];

  const [activeCategory, setActiveCategory] = useState("ATT");
  const [loading, setLoading] = useState(false);
  const [selectedDescriptors, setSelectedDescriptors] = useState(null);

  // Categorize data
  const categorizedData = useMemo(() => {
    const categories = {
      ATT: [],
      DTA: [],
      DIA: [],
      CMD: [],
      STS: [],
    };

    if (Array.isArray(deviceData)) {
      deviceData.forEach((serviceData) => {
        if (serviceData && serviceData.serviceNameEnum) {
          const category = serviceData.serviceNameEnum.split("_")[0];
          if (categories[category]) {
            categories[category].push(serviceData);
          }
        }
      });
    }

    return categories;
  }, [deviceData]);

  // Determine available categories
  const availableCategories = Object.keys(categorizedData).filter(
    (category) => categorizedData[category].length > 0
  );

  const publishMqttMessage = async (category) => {
    setLoading(true);
    if (window.WebViewJavascriptBridge) {
      try {
        const topicMap = {
          ATT: "emit/content/bleData/att",
          DTA: "emit/content/bleData/dta",
          DIA: "emit/content/bleData/dia",
          CMD: "emit/content/bleData/cmd",
          STS: "emit/content/bleData/sts",
        };

        const topic = topicMap[category];
        const dataToPublish = {
          category,
          data: categorizedData[category],
        };
        // Add your MQTT publish logic here
        window.WebViewJavascriptBridge.callHandler(
          "mqttPublishMsg",
          dataToPublish,
          (responseData) => {
            setLoading(false);
            toast.success("Message published successfully", {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
              transition: Bounce,
            });
          }
        );
        console.log(`Publishing to ${topic}:`, dataToPublish);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error publishing message:", error);
        alert("Failed to publish message. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Descriptors Dialog Component
  const DescriptorsDialog = ({ descriptors, isOpen, onClose }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Descriptors</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {Object.entries(descriptors).map(([descUuid, descItem]) => (
            <div key={descUuid} className="flex justify-between items-center mb-2">
              <code className="text-xs text-gray-500">{descUuid}</code>
              <span className="text-sm">{descItem.desc}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  // No data available state
  if (!deviceData || deviceData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
          <p className="text-gray-600">
            Please ensure you've connected to a device and retrieved data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Device Data</h1>

      {/* Publish Button */}
      <Button
        onClick={() => publishMqttMessage(activeCategory)}
        disabled={loading}
        className="mb-4 bg-oves-blue"
      >
        <Send className="mr-2 h-4 w-4" />
        {loading ? "Publishing..." : `Publish ${activeCategory} Data`}
      </Button>

      {/* Category Selection with Radio Buttons */}
      <RadioGroup
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="flex mb-6 space-x-4"
      >
        {availableCategories.map((category) => (
          <div key={category} className="flex items-center space-x-2">
            <RadioGroupItem value={category} id={category} />
            <Label htmlFor={category}>{category}</Label>
          </div>
        ))}
      </RadioGroup>

      {/* Category Content */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service Name</TableHead>
            <TableHead>UUID</TableHead>
            <TableHead>Characteristic Name</TableHead>
            <TableHead>Characteristic UUID</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Properties</TableHead>
            <TableHead>Descriptors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categorizedData[activeCategory].map((serviceData) => (
            Object.entries(serviceData.characterMap || {}).map(([charUuid, characteristic]) => (
              <TableRow key={`${serviceData.uuid}-${charUuid}`}>
                <TableCell>{serviceData.serviceNameEnum?.replace(/_/g, " ") || "Unnamed Service"}</TableCell>
                <TableCell><Badge variant="outline">{serviceData.uuid}</Badge></TableCell>
                <TableCell>{characteristic.name || "Unnamed Characteristic"}</TableCell>
                <TableCell><Badge variant="outline">{charUuid}</Badge></TableCell>
                <TableCell>{String(characteristic.realVal)}</TableCell>
                <TableCell>{characteristic.properties}</TableCell>
                <TableCell>
                  {characteristic.descMap && Object.keys(characteristic.descMap).length > 0 && (
                    <DialogTrigger asChild>
                      <Button variant="outline" className="bg-oves-blue text-white" size="sm" onClick={() => setSelectedDescriptors(characteristic.descMap)}>
                        Show Descriptors
                      </Button>
                    </DialogTrigger>
                  )}
                </TableCell>
              </TableRow>
            ))
          ))}
        </TableBody>
      </Table>

      {/* Descriptors Dialog */}
      <DescriptorsDialog
        descriptors={selectedDescriptors}
        isOpen={!!selectedDescriptors}
        onClose={() => setSelectedDescriptors(null)}
      />

      {/* Info Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full bg-oves-blue"
        onClick={() => alert("Device data categories and their characteristics")}
      >
        <Info className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default BleDataPage;

