require("babel-polyfill");
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const { IoTeXApp } = require("./iotex");

const { app, BrowserWindow, ipcMain } = require("electron");

const Antenna = require("iotex-antenna").default;
const { publicKeyToAddress } = require("iotex-antenna/lib/crypto/crypto");
const { SealedEnvelop } = require("iotex-antenna/lib/action/envelop");

const { abi } = require("./abi");

class LedgerSigner {
  constructor(address, publicKey) {
    this.publicKey = publicKey;
    this.address = address;
  }

  async signOnly(envelop) {
    const transport = await TransportNodeHid.create();
    transport.setDebugMode(true);
    const app = new IoTeXApp(transport);
    const signed = await app.sign([44, 304, 0, 0, 0], envelop.bytestream());
    await transport.close();
    if (signed.code !== 36864) {
      throw new Error(signed.message || "ledger error");
    }
    return new SealedEnvelop(envelop, this.publicKey, signed.signature);
  }

  async getAccount(address) {
    return {address: address};
  }
}

function getAddressInfo() {
  return TransportNodeHid.create()
    .then(transport => {
      transport.setDebugMode(true);
      const app = new IoTeXApp(transport);
      return app.publicKey([44, 304, 0, 0, 0]).then(r =>
        transport
          .close()
          .catch(e => {})
          .then(() => r)
      );
    })
    .catch(e => {
      console.warn(e);
      return new Promise(s => setTimeout(s, 1000)).then(() =>
        getAddressInfo()
      );
    });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 800, height: 600 });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", function() {
    mainWindow = null;
  });

  ipcMain.on("getAddress", () => {
    getAddressInfo().then(result => {
      const address = publicKeyToAddress(result.publicKey.toString("hex"));
      mainWindow.webContents.send("addressInfo", {address: address, publicKey: result.publicKey});
    });
  });

  ipcMain.on("sendIOTX", async (event, address, publicKey, recipient, amount) => {
    const antenna = new Antenna("http://api.iotex.one:80", {signer: new LedgerSigner(address, publicKey)});
    try {
      const hash = await antenna.iotx.sendTransfer({
        from: address,
        to: recipient,
        value: amount,
        gasLimit: "100000",
        gasPrice: "1000000000000"
      });
      mainWindow.webContents.send("sendInfo", {hash: hash});
    } catch (e) {
      mainWindow.webContents.send("sendError", {message: e.message || "send iotx error"});
    }
  });

  ipcMain.on("sendVITA", async (event, address, publicKey, recipient, amount) => {
    const antenna = new Antenna("http://api.iotex.one:80", {signer: new LedgerSigner(address, publicKey)});

    try {
      const hash = await antenna.iotx.executeContract(
        {
          from: address,
          // testnet io1hy9w96v7gz7mqquyyacfhtqn6r0yasnsqrjk9h
          contractAddress: "io1hy9w96v7gz7mqquyyacfhtqn6r0yasnsqrjk9h",
          abi: JSON.stringify(abi),
          amount: "0",
          method: "transfer",
          gasPrice: "1000000000000",
          gasLimit: "1000000"
        },
        recipient,
        amount
      );
      mainWindow.webContents.send("sendInfo", {hash: hash});
    } catch (e) {
      mainWindow.webContents.send("sendError", {message: e.message || "send vita error"});
    }
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function() {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function() {
  if (mainWindow === null) {
    createWindow();
  }
});
