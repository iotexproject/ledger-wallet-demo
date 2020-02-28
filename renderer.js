const { ipcRenderer } = require("electron");

document.getElementById("main").innerHTML =
  "<h1>Connect your Ledger and open IoTeX app...</h1>";

ipcRenderer.on("addressInfo", (event, arg) => {
  document.getElementById("main").innerHTML = `
  <h1>Your first IoTeX address:</h1>
  <h2>${arg.address}</h2>
  <hr>
  <lable>Recipient:</lable><input id="address" type="text" size=50>
  <lable>Amount:</lable><input id="amount" type="text" size=50>
  <br>
  <button id="iotx">Send IOTX</button>
  <br>
  <button id="vita">Send VITA</button>
  <br>
  <h4 id="hash"></h4>
  `;
  const iotx = document.querySelector("#iotx");
  const vita = document.querySelector("#vita");
  iotx.onclick = ()=>
  {
    const recipient = document.querySelector("#address").value;
    const amount = document.querySelector("#amount").value;
    ipcRenderer.send('sendIOTX', arg.address, arg.publicKey, recipient, amount);
  }
  vita.onclick = ()=>
  {
    const recipient = document.querySelector("#address");
    const amount = document.querySelector("#amount");
    ipcRenderer.send('sendVITA', arg.address, arg.publicKey, recipient, amount);
  }
});

ipcRenderer.on("sendInfo", (event, arg) => {
  document.getElementById("hash").innerHTML = "Send hash: " + arg.hash;
});

ipcRenderer.on("sendError", (event, arg) => {
  document.getElementById("hash").innerHTML = "Send error: " + arg.message;
});

ipcRenderer.send("getAddress");
