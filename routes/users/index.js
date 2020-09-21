const express = require('express');
const router = express.Router();
const userAuth = require("../../controllers/userAuth");

router.post("/loginByPassword",(req, res, next)=>{
    const {phone, password} = req.body;
    userAuth.login_by_password({phone:phone, password: password},(err,user,info)=>{
        if (err) return next(err);
        if (!user) return res.status(401).json(info);
        res.json(info.body);
    })
})

module.exports = router;