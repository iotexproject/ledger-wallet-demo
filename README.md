# Ledger wallet demo

IoTeX Ledger Electron demo that uses node-hid.

## Library

The [iotex.js](./iotex.js) provides a basic client library to communicate with a IoTeX App running in a Ledger Nano S/X.

### Usage

Include the necessary library in wallet app.

```js
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const { IoTeXApp } = require("./iotex");

// IoTex js lib
const Antenna = require("iotex-antenna").default;
// connect to mainnet
const antenna = new Antenna("http://api.iotex.one:80");

// GetAddress
async function getAddressInfo() {
  const transport = await TransportNodeHid.open("");
  transport.setDebugMode(true);

  const app = new IoTeXApp(transport);
  const publicKey = await app.publicKey([44, 304, 0, 0, 0]);
  await transport.close();
  return {
    publicKey: publicKey.publicKey
  };
}

// Sign action
async function sign(address, data){
  const transport = await TransportNodeHid.open("");
  transport.setDebugMode(true);

  const app = new IoTeXApp(transport);
  const signed = await app.sign([44, 304, 0, 0, 0], data);
  await transport.close();
  return {
    data: signed.signature,
    publicKey: this.publicKey,
  };
}
```

---

## Demo

This demo was bootstrapped with **electron-quick-start**.

### Run

```bash
npm install
npm run start
```
