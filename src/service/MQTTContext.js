import React, { createContext, useContext, useEffect, useState } from "react";
import mqtt from "mqtt";

// Create MQTT Context
const MQTTContext = createContext();

export const MQTTProvider = ({ children }) => {
  const [client, setClient] = useState(null);

  useEffect(() => {
    const options = {
      port: 1883,
      username: "Scanner1",
      password: "!mqttsc.2024#",
      clientId: "mqtt-explorer-451dc7fb",
    };

    const client = mqtt.connect("mqtt://mqtt.omnivoltaic.com", options);

    client.on("connect", () => {
      console.log("Connected to MQTT Broker");
      setClient(client);
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
  }, []);

  return <MQTTContext.Provider value={client}>{children}</MQTTContext.Provider>;
};

// Custom hook for using MQTT client
export const useMQTT = () => {
  return useContext(MQTTContext);
};
