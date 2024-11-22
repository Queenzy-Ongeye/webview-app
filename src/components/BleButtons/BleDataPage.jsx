import React, { useState, useMemo } from "react";
import { Badge, Info, Send } from "lucide-react";
import { useStore } from "../../service/store";
import { toast, Bounce } from "react-toastify";
import { Button } from "../reusableCards/Buttons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../reusableCards/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../reusableCards/dialog";

const BleDataPage = () => {
  const { state } = useStore();
  const deviceData = state?.initBleData?.dataList || [];

  const [activeCategory, setActiveCategory] = useState("STS");
  const [loading, setLoading] = useState(false);

  const categorizedData = useMemo(() => {
    const categories = {
      STS: [],
      ATT: [],
      DTA: [],
      DIA: [],
      CMD: [],
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

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error publishing message:", error);
        alert("Failed to publish message. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const DescriptorsDialog = ({ descriptors }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-oves-blue">
          Show Descriptors
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Descriptors</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {Object.entries(descriptors).map(([descUuid, descItem]) => (
            <div
              key={descUuid}
              className="flex justify-between items-center mb-2 text-white"
            >
              <code className="text-xs text-white">{descUuid}</code>
              <span className="text-sm text-white">{descItem.desc}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

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

      <Button
        onClick={() => publishMqttMessage(activeCategory)}
        disabled={loading}
        className="mb-4 bg-oves-blue text-white"
      >
        <Send className="mr-2 h-4 w-4" />
        {loading ? "Publishing..." : `Publish ${activeCategory} Data`}
      </Button>

      <div className="flex mb-6 space-x-2">
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeCategory === category
                ? "bg-oves-blue text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {categorizedData[activeCategory].map((serviceData) => (
        <div key={serviceData.uuid} className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold">
              {serviceData.serviceNameEnum
                ? serviceData.serviceNameEnum.replace(/_/g, " ")
                : "Unnamed Service"}
            </h2>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Characteristic Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Descriptors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(serviceData.characterMap || {}).map(
                ([charUuid, characteristic]) => (
                  <TableRow
                    key={`${serviceData.uuid}-${charUuid}`}
                    className="text-sm"
                  >
                    <TableCell className="py-2">
                      {characteristic.name || "Unnamed Characteristic"}
                    </TableCell>
                    <TableCell className="py-2">
                      {String(characteristic.realVal)}
                    </TableCell>
                    <TableCell className="py-2">
                      {characteristic.properties}
                    </TableCell>
                    <TableCell className="py-2">
                      {characteristic.descMap &&
                        Object.keys(characteristic.descMap).length > 0 && (
                          <DescriptorsDialog
                            descriptors={characteristic.descMap}
                          />
                        )}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      ))}

      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full bg-oves-blue"
        onClick={() =>
          alert("Device data categories and their characteristics")
        }
      >
        <Info className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default BleDataPage;
