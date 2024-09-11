// pages/api/publish.js
import { createMqttConnection } from "../../server/mqttClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { data } = req.body; // Extract the data from the request body

    // Create an MQTT client connection using TCP (mqtt://)
    const client = createMqttConnection();

    if (client) {
      // Wait for the MQTT client to connect using TCP
      client.on("connect", () => {
        console.log("MQTT client connected using TCP on server.");

        const payload = JSON.stringify(data); // Convert the data to JSON string

        // Publish the data to the 'emit/content/bleData/sts' topic
        client.publish(
          topic,
          payload,
          { qos: 1 },
          (err) => {
            if (err) {
              console.error("Failed to publish data via TCP:", err);
              return res.status(500).json({ error: "Failed to publish data" });
            } else {
              console.log(
                "Data successfully published to MQTT via TCP:",
                payload
              );
              return res.status(200).json({ success: true });
            }
          }
        );
      });

      // Handle MQTT connection errors
      client.on("error", (err) => {
        console.error("MQTT TCP connection error:", err);
        return res.status(500).json({ error: "MQTT connection error" });
      });
    } else {
      return res.status(500).json({ error: "MQTT client not initialized" });
    }
  } else {
    // Only allow POST requests
    res.status(405).json({ error: "Method not allowed" });
  }
}
