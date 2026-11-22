import React from "react";

function Police({ police }) {
  return (
    <>
      {police.map((cop) => (
        <div
          key={cop.id}
          className="cr-police"
          style={{
            left: cop.x - 25,
            top: cop.y - 42,
            transform: `rotate(${cop.angle}rad)`,
          }}
        >
          <div className="police-light">
            <span />
            <span />
          </div>

          <div className="police-window" />

          <div className="police-body">
            <b />
            <b />
            <b />
            <b />
          </div>

          <small>POLICE</small>
        </div>
      ))}
    </>
  );
}

export default Police;