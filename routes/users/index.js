const express = require('express');
const router = express.Router();
const userAuth = require("../../controllers/userAuth");


router.post("/loginByVerificationCode",async(req, res, next)=>{
    const {phone, code} = req.body;
    let login_message = await userAuth.login_by_verification_code({ phone, code })
    if(!login_message.error){
        if(!code){
            console.log(login_message)
            res.json(login_message.msg)
        }else{
            res.header({ Authorization: login_message.headers.Authorization });
            res.json(login_message.body);
        }
    }else{
        next(login_message.error)
    }
})

module.exports = router;