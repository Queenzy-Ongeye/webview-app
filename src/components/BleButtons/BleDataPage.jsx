import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../../service/store";
import { Loader2, Send, Info } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../reusableCards/dialog";

const BleDataPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch, state } = useStore();
  const [loading, setLoading] = useState(location.state?.loading || false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("STS");

  useEffect(() => {
    const initializeData = async () => {
      if (location.state?.loading && location.state?.macAddress) {
        try {
          const response = await initBleData(location.state.macAddress);
          dispatch({ type: "SET_INIT_BLE_DATA", payload: response });
          setLoading(false);
        } catch (error) {
          console.error("Initialization error:", error);
          setError("Failed to initialize BLE data. Please try again.");
          setLoading(false);
        }
      }
    };

    initializeData();
  }, [location.state, dispatch]);

  const initBleData = (macAddress) => {
    return new Promise((resolve, reject) => {
      if (!window.WebViewJavascriptBridge) {
        reject(new Error("WebViewJavascriptBridge not initialized"));
        return;
      }

      console.log("Initializing BLE data for:", macAddress);

      window.WebViewJavascriptBridge.callHandler(
        "initBleData",
        macAddress,
        (responseData) => {
          try {
            console.log("Raw init response:", responseData);
            const parsedData = JSON.parse(responseData);
            console.log("Parsed init response:", parsedData);
            resolve(parsedData);
          } catch (error) {
            console.error("Error parsing init response:", error);
            reject(
              new Error(
                `Failed to parse initialization response: ${error.message}`
              )
            );
          }
        }
      );
    });
  };

  const categorizedData = useMemo(() => {
    const categories = {
      STS: [],
      ATT: [],
      DTA: [],
      DIA: [],
      CMD: [],
    };

    if (state.initBleData && Array.isArray(state.initBleData.dataList)) {
      state.initBleData.dataList.forEach((serviceData) => {
        if (serviceData && serviceData.serviceNameEnum) {
          const category = serviceData.serviceNameEnum.split("_")[0];
          if (categories[category]) {
            categories[category].push(serviceData);
          }
        }
      });
    }

    return categories;
  }, [state.initBleData]);

  const availableCategories = Object.keys(categorizedData).filter(
    (category) => categorizedData[category].length > 0
  );

  const publishMqttMessage = async (category) => {
    setLoading(true);
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

      if (window.WebViewJavascriptBridge) {
        window.WebViewJavascriptBridge.callHandler(
          "mqttPublishMsg",
          dataToPublish,
          () => {
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
      } else {
        throw new Error("WebViewJavascriptBridge not initialized");
      }

      console.log(`Publishing to ${topic}:`, dataToPublish);
    } catch (error) {
      console.error("Error publishing message:", error);
      toast.error("Failed to publish message. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-700">Initializing BLE data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
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
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            variant={activeCategory === category ? "default" : "outline"}
          >
            {category}
          </Button>
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
