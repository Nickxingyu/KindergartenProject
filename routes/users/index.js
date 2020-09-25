const express = require('express');
const router = express.Router();
const userAuth = require("../../controllers/userAuth");
const userKey = require('../../models/database/mongo/DataBase/userKey');
const key = require('../../config/key');

router.post("/loginByPassword",(req, res, next)=>{
    const {phone, password, publicKey} = req.body;
    userAuth.login_by_password(
        {
            phone, 
            password,
            publicKey
        },
        (err, result, info)=>{
        if (err) next(err);
        else if (!result) res.status(401).json(info);
        else if(!info.headers) res.json(info);
        else{
            res.header({ Authorization: info.headers.Authorization });
            res.json(info.body);
        }
    })
})

router.post("/loginByVerificationCode",(req, res, next)=>{
    const {phone} = req.body;
    const authorization = req.header('Authorization');
    const token = authorization ? authorization.replace('Bearer ', '') : null;
    userAuth.login_by_verification_code(
        { phone, token},
        (err, result, info)=>{
            if(err) next(err);
            else if(!result) res.status(401).json(info);
            else if(!info.headers) res.json(info);
            else{
                res.header({ Authorization: info.headers.Authorization });
                res.json(info.body);
            }
    })
})

router.post('/modifyPassword',(req,res,next) => {
    const {phone} = req.body;
    const authorization = req.header('Authorization');
    const token = authorization ? authorization.replace('Bearer ', '') : null;
    userAuth.modify_password({phone, token}, (err, result, info) => {
        if(err) next(err)
        else if(!result) res.status(401).json(info);   
        else res.json(info);
    })
})

router.post("/getVerificationCode",(req, res, next)=>{
    const {phone} = req.body;
    userAuth.send_verification_code(phone,(err, user, info)=>{
        if(err) next(err)
        if(!user) res.status(401).json(info);
        res.json(info);
    })
})

module.exports = router;