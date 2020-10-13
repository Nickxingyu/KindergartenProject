const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');

const {database_message, message} = require('../models/enum/msg_enum');
const User = require('../models/database/mongo/DataBase/user');

router.post('/add',(req, res, next)=>{
    const uuid = uuidv4()
    let {phone, password, name} = req.body
    if(!password) res.status(401).json(api_message.content_not_complete())
    else{
        password = User.generateHash(password)
        User.insertMany([
            {
                user:{
                    uuid,
                    phone,
                    password,
                    name,
                    role: 'teacher'
                }
            }
        ],(err, result)=>{
            if(err) res.status(500).json(database_message.database_fail())
            else res.json(message.succeed())
        })
    }
})

router.get('/allTeacher',(req,res,next)=>{
    User.find({
        'user.role':'teacher'
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

module.exports = router;