import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Send, ArrowLeft } from "lucide-react";
import { useStore } from "../../service/store";
import { toast } from "react-toastify";
import { Button } from "../reusableCards/Buttons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../reusableCards/table";
import BleDataTableItem from "./BleTableContainer";

const BleDataPage = React.memo(() => {
  const { state } = useStore();
  const deviceData = state?.initBleData?.dataList || [];
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("STS");
  const [loading, setLoading] = useState(false);

  const categorizedData = useMemo(() => {
    const categories = {
      ATT: [],
      CMD: [],
      STS: [],
      DTA: [],
      DIA: [],
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

  const handleGoBack = useCallback(() => {
    navigate("/home", { replace: true });
  }, [navigate]);

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

  return (
    <div className="container mx-auto">
      <div className="mb-2 flex">
        <Button
          onClick={handleGoBack}
          variant="outline"
          size="sm"
          className="mb-4 bg-gray-900 text-gray-700 hover:bg-gray-800 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4 bg-gray-900 text-gray-700 hover:bg-gray-800 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-white" />
        </Button>
        <h1 className="text-3xl font-bold">Device Data</h1>
      </div>

      <Button
        onClick={() => publishMqttMessage(activeCategory)}
        disabled={loading}
        className="mb-4 bg-gray-900 text-gray-700 hover:bg-gray-800 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-white"
      >
        <Send className="mr-2 h-4 w-4" />
        {loading ? "Publishing..." : `Publish ${activeCategory} Data`}
      </Button>

      <div className="flex mb-6 space-x-2">
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-white ${
              activeCategory === category
                ? "bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-white"
                : "bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {categorizedData[activeCategory]?.length > 0 ? (
        categorizedData[activeCategory].map((serviceData) => (
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
                {Object.entries(serviceData.characteristicList || {}).map(
                  ([charUuid, characteristic]) => (
                    <BleDataTableItem
                      key={`${serviceData.uuid}-${charUuid}`}
                      characteristic={characteristic}
                      serviceUuid={serviceData.uuid}
                    />
                  )
                )}
              </TableBody>
            </Table>
          </div>
        ))
      ) : (
        <div>No data available for this category</div>
      )}

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
});

export default BleDataPage;
