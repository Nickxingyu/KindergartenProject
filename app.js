const express = require("express");
const helmet = require("helmet");

const config = require("./config.json");
const location = require("./routes/location");

var app = express();
var port = config.server.port;

app.get('/', function (req, res) {
  res.send('Hello World!');
});
app.use("/location",location);
app.use(helmet());
app.listen(port, function () {
  console.log("Example app listening at http://localhost:".concat(port));
});