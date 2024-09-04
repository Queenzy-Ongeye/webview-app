import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { StoreProvider, useStore } from "./service/store";
import NavigationBar from "./components/NavBar";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import mqtt from "mqtt";

const Home = lazy(() => import("./Home"));
const AttPage = lazy(() => import("./components/DeviceDetails/ATTPage"));
const StsPage = lazy(() => import("./components/DeviceDetails/STSPage"));
const CMDPage = lazy(() => import("./components/DeviceDetails/CMDPage"));
const DTAPage = lazy(() => import("./components/DeviceDetails/DTAPage"));
const DIAPage = lazy(() => import("./components/DeviceDetails/DIAPage"));
const ScanData = lazy(() => import("./components/scanQr-Barcode/ScanData"));

const MQTTInitializer = () => {
  const { dispatch } = useStore();
  useEffect(() => {
    const options = {
      username: "Scanner2",
      password: "!mqttsc.2024#",
      clientId: "emqx_MDY1Mz",
    };

    const client = mqtt.connect(
      "wss://emqx.omnivoltaic.com.8084/mqtt",
      options
    );

    client.on("connect", () => {
      console.log("Connected to MQTT Broker");
      dispatch({ type: "SET_MQTT_CLIENT", payload: client });
    });

    client.on("error", (err) => {
      console.error("MQTT Connection error: ", err.message);
    });

    client.on("disconnect", () => {
      console.log("Disconnected from MQTT broker");
    });

    return () => {
      if (client) client.end();
    };
  }, [dispatch]);

  return null;
};
const App = () => {
  return (
    <StoreProvider>
      <MQTTInitializer/>
      <Router>
        <div className="min-h-screen flex">
          <NavigationBar />
          <div className="flex-grow">
            <Suspense
              fallback={
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <AiOutlineLoading3Quarters className="animate-spin h-10 w-10 text-white" />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/att" element={<AttPage />} />
                <Route path="/cmd" element={<CMDPage />} />
                <Route path="/sts" element={<StsPage />} />
                <Route path="/dta" element={<DTAPage />} />
                <Route path="/dia" element={<DIAPage />} />
                <Route path="/scan-data" element={<ScanData />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </Router>
    </StoreProvider>
  );
};

export default App;
