import mqtt from "mqtt";

// TCP connection URL for MQTT (replace with your broker's address and port)
const MQTT_BROKER_URL = "mqtt://your-broker-address:1883"; // Replace with actual broker address and port

const MQTT_OPTIONS = {
  username: "Scanner1",
  password: "!mqttsc.2024#", // Replace with your credentials
  clientId: `mqttjs_${Math.random().toString(16).slice(3)}`,
  clean: true, // Clean session
  reconnectPeriod: 1000, // Retry connection every second if disconnected
  connectTimeout: 30 * 1000, // 30 seconds timeout for connection
  keepalive: 60, // Ping server every 60 seconds to keep the connection alive
  resubscribe: true, // Automatically resubscribe to topics on reconnect
};

// Function to create the MQTT client connection using TCP
export const createMqttConnection = () => {
  const client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

  client.on("connect", () => {
    console.log("MQTT TCP connection established.");
  });

  client.on("error", (err) => {
    console.error("MQTT connection error:", err);
  });

  client.on("offline", () => {
    console.log("MQTT client is offline.");
  });

  client.on("reconnect", () => {
    console.log("MQTT client is attempting to reconnect...");
  });

  return client;
};
