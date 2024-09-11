import mqtt from "mqtt";

// Debugging to get detailed connection logs
process.env.DEBUG = "mqttjs*";

const MQTT_BROKER_URL = "wss://mqtt.omnivoltaic.com:8084"; // Replace with correct port if needed

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

export const createMqttConnection = () => {
  if(typeof window === "undefined"){
    // server-side connection (SSR)
    const client = mqtt.connect("mqtt://mqtt.omnivoltaic.com:1883", MQTT_OPTIONS);
    console.log("Server side Mqtt client created...");
    return client;
  }else{
    const client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);
    console.log("client-side MQTT client created");
    return client;
  }
}