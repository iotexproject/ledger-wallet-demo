require("babel-polyfill");
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const { IoTeXApp } = require("./iotex");

const { app, BrowserWindow, ipcMain } = require("electron");

const Antenna = require("iotex-antenna").default;

const { ISigner, SignedData } = require("iotex-antenna/lib/account/signer");

const antenna = new Antenna("http://api.testnet.iotex.one:80");

class LedgerSigner {
  async sign(address, data){
    const transport = await TransportNodeHid.open("");
    const app = new IoTeXApp(transport);
    const signed = await app.sign([44, 304, 0, 0, 0], data);
    console.log(signed);
    return {
      data: Buffer.from(""),
      publicKey: publicKey.compressedPublicKey,
    };
  }
}

function getAddressInfo() {
  return TransportNodeHid.open("")
    .then(transport => {
      transport.setDebugMode(true);
      const app = new IoTeXApp(transport);
      return app.getAddressAndPubKey([44, 304, 0, 0, 0], "io").then(r =>
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
    getAddressInfo(false).then(result => {
      mainWindow.webContents.send("addressInfo", result);
    });
  });

  ipcMain.on("sendIOTX", async (event, address) => {
    const sender = antenna.iotx.accounts.addressToAccount(
      address,
      new LedgerSigner(),
    );
    const hash = await antenna.iotx.sendTransfer({
      from: sender.address,
      to: "io187wzp08vnhjjpkydnr97qlh8kh0dpkkytfam8j",
      value: "1000000000000000000",
      gasLimit: "100000",
      gasPrice: "1"
    });
    console.log(hash);
  });
  ipcMain.on("sendVITA", (event, address) => {
    console.log(address);
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
