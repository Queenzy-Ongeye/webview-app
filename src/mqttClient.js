import mqtt from "mqtt";

// Debugging to get detailed connection logs
window.localStorage.setItem('debug', 'mqttjs*');

const MQTT_BROKER_URL = "wss://mqtt.omnivoltaic.com:1883"; // Replace with correct port if needed

const MQTT_OPTIONS = {
  username: "Scanner1",
  password: "!mqttsc.2024#",
  clientId: `mqttjs_${Math.random().toString(16).slice(3)}`,
  clean: true,
  reconnectPeriod: 1000,  // Retry connection every second if disconnected
};

const client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

client.on("connect", () => {
  console.log("MQTT client connected to broker");
});

client.on("reconnect", () => {
  console.log("MQTT client attempting to reconnect...");
});

client.on("error", (err) => {
  console.error("MQTT connection error:", err);
});

client.on("offline", () => {
  console.log("MQTT client is offline");
});

client.on("disconnect", () => {
  console.log("MQTT client disconnected");
});

export default client;