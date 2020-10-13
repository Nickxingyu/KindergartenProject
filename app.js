const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const logger = require("morgan");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const config = require("./config/config.json");
const users = require("./routes/users/index");
const child = require('./routes/child');
const direction = require('./routes/direction');
const driver = require('./routes/driver');
const teacher = require('./routes/teacher');
const { JwtToBody } = require("./middlewares/validations/authorization/accessValidate");

var app = express();
var port = config.server.port;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(helmet());
app.use(logger(':date - :method :url HTTP/:http-version :status - :response-time ms'));
app.use(JwtToBody)
app.get('/', function (req, res) {
    res.status(200).send("Hello World")
});
app.use('/users',users);
app.use('/child',child);
app.use('/direction',direction);
app.use('/driver',driver);
app.use('/teacher',teacher)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

require("./models/database/redis/connect");
require("./models/database/mongo/connect")(mongoose, ()=>{
    app.listen(port, function () {
        console.log("http://localhost:".concat(port));
    });
})