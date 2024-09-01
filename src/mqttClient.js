import React from 'react';

const MQTT_BROKER_URL = 'http://mqtt.omnivoltaic.com:1883';
const MQTT_OPTIONS = {
    clientId: `mqttjs_${Math.random().toString(16).slice(3)},`
};
const client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

client.on('connect', () => {
    console.log('MQTT client connected to broker');
});

client.on('error', (error) =>{
    console.error('MQTT connection error', error);
});

client.on('disconnect', () =>{
    console.error('MQTT client disconnected');
});

export default client;