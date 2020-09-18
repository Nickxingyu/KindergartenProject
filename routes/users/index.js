const express = require('express');
const router = express.Router();
const userAuth = require("../../controllers/userAuth");

router.use("/testPWD",(req,res,next)=>{
    const phone = "0985895611";
    const pwd = "2307199685Nick";
    userAuth.loginByPassword({phone:phone, password: pwd},(err,user,info)=>{
        if (err) return next(err);
        if (!user) return res.status(401).json(info);
        res.json(info.body);
    })
})

module.exports = router;