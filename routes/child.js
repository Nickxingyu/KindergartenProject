const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const {api_message, database_message, message} = require('../models/enum/msg_enum');
const PickupList = require('../models/database/mongo/DataBase/pickupList');
const User = require('../models/database/mongo/DataBase/user');
const Direction = require('../models/database/mongo/DataBase/direction');
const {getPickupStatus, getPickupDay, modifyPickupDays} = require('../controllers/children');

router.post('/addParent',async(req, res, next)=>{
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
                        roles: ['parent']
                    }
                }
            ],(err, result)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else res.json(message.succeed())
            })
        }else{
            user.user.roles.push('parent')
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

router.post('/add',(req,res,next)=>{
    const uuid = uuidv4()
    let {phone, name, address, class_number} = req.body;
    let pickupDay = req.body.pickupDay || []
    User.findOne({'user.phone':phone, 'user.roles':'parent'},(err, user)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else if(!user) res.json(database_message.no_user_founded())
        else{
            user.user.children.push(uuid)
            user.save((err, result)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else{
                    User.insertMany([
                        {
                            user:{
                                uuid,
                                name,
                                roles: ['child'],
                                address,
                                class_number,
                                pickupDay
                            }
                        }
                    ],(err, result)=>{
                        if(err) res.status(500).json(database_message.database_fail())
                        else res.json(message.succeed())
                    })
                } 
            })
        }
    })
})

router.get('/allChildren',(req, res, next)=>{
    User.find({'user.roles':'child'},(err, users)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else{
            const children = users.map(user=>{
                const {uuid, name, phone, pickup} = user.user
                return {
                    uuid,
                    name,
                    phone,
                    pickup
                }
            }) 
            res.json(children)
        }
    })
})

router.get('/allPickupChildren',async(req, res, next)=>{
    let pickupDay = await getPickupDay();
    if(pickupDay.error){
        let {status, error}= pickupDay;
        res.status(status).json(error)
    }
    else res.json(pickupDay);
})

router.post('/location', async(req, res, next) => {
    const {phone} = req.body;
    User.findOne({
        'user.phone':phone,
        'user.roles':'parent'
    },(err, user)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else if(!user) res.status(401).json(database_message.no_user_founded())
        else{
            const {children} = user.user;
            User.find({
                'user.uuid': {'$in':children},
                'user.roles': 'child'
            },async(err, children)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else{
                    const pickupStatus = await getPickupStatus(children)
                    if(pickupStatus.error) {
                        let {status, error}= children;
                        res.status(status).json(error)
                    }else{
                        res.json({children:pickupStatus})
                    }
                }
            })
        }   
    })
})

router.post('/arrive', (req, res, next) => {
    const {phone, child_uuid} = req.body;
    User.findOne({
        'user.uuid': child_uuid,
        'user.roles': 'child'
    },(err, user)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else if(!user) res.status(500).json(database_message.no_user_founded())
        else{
            const pickupList_uuid = user.user.pickupList
            PickupList.findOne({
                uuid: pickupList_uuid,
                status: 'on_the_way'
            },async(err, pickupList)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else if(!pickupList) res.status(500).json(database_message.lost_pickupList())
                else{
                    let number = 0;
                    for(const i in pickupList.child_list){
                        if(pickupList.child_list[i].uuid ==child_uuid){
                            number = i
                            pickupList.child_list[number].status = 'arrive'
                        } 
                    }
                    pickupList.save(err=>{
                        if(err) res.status(500).json({
                            code:'4',
                            type:'Database',
                            message:'Database fail'
                        })
                        else{
                            Direction.findOne({
                                pickupList: pickupList_uuid
                            },(err, direction)=>{
                                if(err) res.status(500).json(database_message.database_fail())
                                else if(!direction) res.status(500).json(database_message.lost_direction())
                                else{
                                    if(direction.waypoint_order.length == 1){
                                        PickupList.findOneAndUpdate({
                                            uuid: pickupList_uuid
                                        },{
                                            status: "done"
                                        },(err, result)=>{
                                            if(err) res.status(500).json(database_message.database_fail())
                                            else res.json(result)
                                        })
                                    }else{
                                        let waypoint_order = direction.waypoint_order.slice();
                                        let place_ids = direction.place_ids.slice();
                                        const index = waypoint_order.indexOf(number)
                                        const length = waypoint_order.length;
                                        waypoint_order = waypoint_order.slice(0,index).concat(waypoint_order.slice(index+1, length))
                                        place_ids = place_ids.slice(0,index).concat(place_ids.slice(index + 1, length))
                                        Direction.findOneAndUpdate({
                                            pickupList: pickupList_uuid
                                        },{
                                            waypoint_order,
                                            place_ids
                                        },(err, result)=>{
                                            if(err) res.status(500).json(err)
                                            else{
                                                res.json(result)
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

router.put('/modifyPickupDays', async(req, res, next)=>{
    const {pickupDays_list} = req.body;
    let result;
    try{
        result = await modifyPickupDays(pickupDays_list);
    }catch(e){
        res.status(500).json({
            code:"4",
            type:"Database",
            message:"Database fail"
        })
    }
    res.json(message.succeed())
})

module.exports = router;