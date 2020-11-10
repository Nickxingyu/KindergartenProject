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
const driver = require('./routes/driver');
const teacher = require('./routes/teacher');
const pickupList = require('./routes/pickupList');
const { JwtToBody } = require("./middlewares/validations/authorization/accessValidate");

var app = express();
var port = config.server.port;

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(helmet());
app.use(logger(':date - :method :url HTTP/:http-version :status - :response-time ms'));
app.use('/users',users);
app.use('/child',child);
app.use('/pickupList', pickupList);
app.use('/driver',driver);
app.use('/teacher',teacher)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

require("./models/database/redis/connect");
require("./models/database/mongo/connect")(mongoose, ()=>{
    app.listen(port, function () {
        console.log("http://localhost:".concat(port));
    });
})

function cors() {
    return function cors(req, res, next) {
        if (!res.headersSent) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Expose-Headers", "Authorization");
            res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept,authorization");
        }
        return next();
    };
}