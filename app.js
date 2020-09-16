const express = require("express");

const location = require("./routes/location");

var app = express();
var port = 3000;

app.get('/', function (req, res) {
  res.send('Hello World!');
});
app.use("/location",location);
app.listen(port, function () {
  console.log("Example app listening at http://localhost:".concat(port));
});