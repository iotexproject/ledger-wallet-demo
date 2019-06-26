const { ipcRenderer } = require("electron");

document.getElementById("main").innerHTML =
  "<h1>Connect your Ledger and open IoTeX app...</h1>";

ipcRenderer.on("addressInfo", (event, arg) => {
  document.getElementById("main").innerHTML = `
  <h1>Your first IoTeX address:</h1>
  <h2>${arg.address}</h2>
  <button id="iotx">Send 1 IOTX</button>
  <br>
  <button id="vita">Send 1 VITA</button>
  <br>
  <h4 id="hash"></h4>
  `;
  const iotx = document.querySelector("#iotx");
  const vita = document.querySelector("#vita");
  iotx.onclick = ()=>
  {
    ipcRenderer.send('sendIOTX', arg.address, arg.publicKey);
  }
  vita.onclick = ()=>
  {
    ipcRenderer.send('sendVITA', arg.address, arg.publicKey);
  }
});

ipcRenderer.on("sendInfo", (event, arg) => {
  document.getElementById("hash").innerHTML = "Send hash: " + arg.hash;
});

ipcRenderer.send("getAddress");
