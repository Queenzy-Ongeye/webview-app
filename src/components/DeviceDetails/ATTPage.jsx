// src/AttPage.js
import React from "react";
import { useLocation } from "react-router-dom";

const AttPage = () => {
  const location = useLocation();
  const { data } = location.state || {};

  const renderCharacterMap = (characterMap) => {
    return Object.entries(characterMap).map(([uuid, char]) => (
      <div key={uuid} className="characteristic">
        <h4>UUID: {uuid}</h4>
        <p>Description: {char.desc}</p>
        <p>Real Value: {char.realVal}</p>
        <p>Service UUID: {char.serviceUuid}</p>
        <p>Value Type: {char.valType}</p>
        <p>Values: {char.values.join(", ")}</p>
        <p>Properties: {char.properties}</p>
        <p>Enable Notify: {char.enableNotify.toString()}</p>
        <p>Enable Read: {char.enableRead.toString()}</p>
      </div>
    ));
  };

  return (
    <div className="att-page">
        <h1>Att page</h1>
      {data &&
        data.map((service, index) => (
          <div key={index} className="service">
            <h3>Service UUID: {service.uuid}</h3>
            <h3>Service Name Enum: {service.serviceNameEnum}</h3>
            <h3>Service Property: {service.serviceProperty}</h3>
            <div className="characteristics">
              {renderCharacterMap(service.characterMap)}
            </div>
          </div>
        ))}
    </div>
  );
};

export default AttPage;
