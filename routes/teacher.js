const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');

const {database_message, message} = require('../models/enum/msg_enum');
const User = require('../models/database/mongo/DataBase/user');

router.post('/add',async(req, res, next)=>{
    let {phone, password, name} = req.body
    if(!password) res.status(401).json(api_message.content_not_complete())
    else{
        let user
        try{
            user = await User.findOne({'user.phone':phone})
        }catch(e){
            const {status, error} = database_fail(e)
            res.status(status).json(error)
        }
        if(!user){
            const uuid = uuidv4();
            password = User.generateHash(password)
            User.insertMany([
                {
                    user:{
                        uuid,
                        phone,
                        password,
                        name,
                        roles: ['teacher']
                    }
                }
            ],(err, result)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else res.json(message.succeed())
            })
        }else{
            user.user.roles.push('teacher')
            try{
                await user.save()
            }catch(e){
                const {status, error} = database_fail(e)
                res.status(status).json(error)
            }
            res.json(message.succeed())
        }
    }
})

router.post('/addPrincipal',async(req, res, next)=>{
    let {phone, password, name} = req.body
    if(!password) res.status(401).json(api_message.content_not_complete())
    else{
        let user
        try{
            user = await User.findOne({'user.phone':phone})
        }catch(e){
            const {status, error} = database_fail(e)
            res.status(status).json(error)
        }
        if(!user){
            const uuid = uuidv4();
            password = User.generateHash(password)
            User.insertMany([
                {
                    user:{
                        uuid,
                        phone,
                        password,
                        name,
                        roles: ['principal']
                    }
                }
            ],(err, result)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else res.json(message.succeed())
            })
        }else{
            user.user.roles.push('principal')
            try{
                await user.save()
            }catch(e){
                const {status, error} = database_fail(e)
                res.status(status).json(error)
            }
            res.json(message.succeed())
        }
    }
})

router.get('/allTeacher',(req,res,next)=>{
    User.find({
        'user.roles':'teacher'
    },(err, users)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else{
            const teachers = users.map(user=>{
                const {uuid, name, phone} = user.user
                return {
                    uuid,
                    name,
                    phone
                }
            }) 
            res.json(teachers)
        }
    })
})

function database_fail(e){
    console.log("Database fail!! \n")
    console.log(e)
    return {
        status:500,
        error:{
            code:"4",
            type:"Database",
            message:"Database fail"
        }
    }
}

module.exports = router;