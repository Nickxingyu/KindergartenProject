const express = require('express');
const router = express.Router();

const {database_message} = require('../models/enum/msg_enum');
const User = require('../models/database/mongo/DataBase/user');


router.get('/getAllTeacher',(req,res,next)=>{
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