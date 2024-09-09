import mqtt from "mqtt";

// Debugging to get detailed connection logs
process.env.DEBUG = "mqttjs*";

const MQTT_BROKER_URL = "wss://mqtt.omnivoltaic.com:1883"; // Replace with correct port if needed

const MQTT_OPTIONS = {
  username: "Scanner1",
  password: "!mqttsc.2024#",
  clientId: `mqttjs_${Math.random().toString(16).slice(3)}`,
  clean: true, // Clean session
  reconnectPeriod: 1000, // Reconnect every second
  connectTimeout: 30 * 1000, // 30 seconds timeout for connection
  keepalive: 60, // Keepalive time, ping server every 60 seconds
  resubscribe: true, // Automatically resubscribe to topics on reconnect
};

let client;

try {
  client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

  client.on("connect", () => {
    console.log("MQTT client connected to broker");
  });

  client.on("reconnect", () => {
    console.log("MQTT client attempting to reconnect...");
  });

  client.on("error", (err) => {
    console.error("MQTT connection error:", err.message);
  });

  client.on("offline", () => {
    console.log("MQTT client is offline");
  });

  client.on("disconnect", () => {
    console.log("MQTT client disconnected");
  });
} catch (error) {
  console.error("MQTT connection failed:", error.message);
}

export default client;
