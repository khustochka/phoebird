const Client = require("../lib/client.js")

let client = new Client()

client.fetchChecklistsData(processChecklists)

function processChecklists(data) {
  console.log(data);
}
