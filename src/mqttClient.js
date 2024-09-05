// src/mqttClient.js
import mqtt from "mqtt";

const MQTT_BROKER_URL = "wss://mqtt.omnivoltaic.com:1883"; // Replace with your EMQX broker URL
const MQTT_OPTIONS = {
  username: "Scanner1",
  password: "!mqttsc.2024#",
  clientId: `mqttjs_${Math.random().toString(16).slice(3)}`,
};

const client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

client.on("connect", () => {
  console.log("MQTT client connected to broker");
});

client.on("error", (err) => {
  console.error("MQTT connection error:", err);
});

client.on("disconnect", () => {
  console.log("MQTT client disconnected");
});

export default client;
