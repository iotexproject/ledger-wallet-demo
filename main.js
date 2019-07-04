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
    const transport = await TransportNodeHid.open("");
    transport.setDebugMode(true);
    const app = new IoTeXApp(transport);
    const signed = await app.sign([44, 304, 0, 0, 0], envelop.bytestream());
    await transport.close();
    return new SealedEnvelop(envelop, this.publicKey, signed.signature);
  }

  async getAccount(address) {
    return {address: address};
  }
}

function getAddressInfo() {
  return TransportNodeHid.open("")
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

  ipcMain.on("sendIOTX", async (event, address, publicKey) => {
    const antenna = new Antenna("http://api.iotex.one:80", {signer: new LedgerSigner(address, publicKey)});
    const hash = await antenna.iotx.sendTransfer({
      from: address,
      to: "io13zt8sznez2pf0q0hqdz2hyl938wak2fsjgdeml",
      value: "1000000000000000000",
      gasLimit: "100000",
      gasPrice: "1000000000000"
    });
    mainWindow.webContents.send("sendInfo", {hash: hash});
  });
  ipcMain.on("sendVITA", async (event, address, publicKey) => {
    const antenna = new Antenna("http://api.iotex.one:80", {signer: new LedgerSigner(address, publicKey)});

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
      "io13zt8sznez2pf0q0hqdz2hyl938wak2fsjgdeml",
      "1000000000000000000"
    );
    mainWindow.webContents.send("sendInfo", {hash: hash});
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
