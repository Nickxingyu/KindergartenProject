const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const logger = require("morgan");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const config = require("./config/config.json");
const location = require("./routes/location");
const users = require("./routes/users/index");

var app = express();
var port = config.server.port;

//app.use("/location",location);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(helmet());
app.use(logger(':date - :method :url HTTP/:http-version :status - :response-time ms'));
app.get('/', function (req, res) {
    res.status(200).send("Hello World")
});
app.use('/users',users);

require("./models/database/redis/connect");
require("./models/database/mongo/connect")(mongoose, ()=>{
    app.listen(port, function () {
        console.log("http://localhost:".concat(port));
    });
})