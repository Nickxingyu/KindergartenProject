const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const {api_message, database_message, message} = require('../models/enum/msg_enum');
const PickupList = require('../models/database/mongo/DataBase/pickupList');
const User = require('../models/database/mongo/DataBase/user');
const Direction = require('../models/database/mongo/DataBase/direction');

router.post('/getLocation', (req, res, next) => {
    const {phone, child_uuid} = req.body;
    User.findOne({
        'user.phone':phone,
        'user.role':'parents'
    },(err, user)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else if(!user) res.status(401).json(database_message.no_user_founded())
        else{
            if(!user.user.children.includes(child_uuid))
                res.status(401).json(api_message.child_uuid_error())
            else{
                User.findOne({
                    'user.uuid': child_uuid,
                    'user.role': 'child'
                },(err, user)=>{
                    if(err) res.status(500).json(database_message.database_fail())
                    else if(!user) res.status(401).json(database_message.no_user_founded())
                    else if(!user.user.pickup) res.status(200).json(api_message.child_not_in_pickup_list())
                    else{
                        PickupList.findOne({
                            uuid: user.user.pickupList
                        },(err, pickupList)=>{
                            if(err) res.status(500).json(database_message.database_fail())
                            else if(!pickupList) res.status(500).json(database_message.lost_pickupList())
                            else{
                                let remaining_time = null;
                                const {location} = pickupList.driver;
                                const {children} = pickupList;
                                children.forEach(child=>{
                                    if(child.uuid == child_uuid) remaining_time = child.remaining_time
                                })
                                res.json({
                                    location,
                                    remaining_time
                                })
                            }
                        })
                    }
                })
            }
        }   
    })
})

router.post('/applyForPickUp', (req, res, next) => {
    const {phone, child_uuid} = req.body;
    User.findOne({
        'user.phone': phone,
        'user.role':'parents'
    },(err, user)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else if(!user) res.status(401).json(database_message.no_user_founded())
        else{
            if(!user.user.children.includes(child_uuid))
                res.status(401).json(api_message.child_uuid_error())
            else{
                User.findOne({
                    'user.uuid': child_uuid,
                    'user.role': 'child'
                },(err, user)=>{
                    if(err) res.status(500).json(database_message.database_fail())
                    else if(!user) res.status(401).json(database_message.no_user_founded())
                    else{
                        user.user.pickup = true
                        user.save(err=>{
                            if(err) res.status(500).json(database_message.database_fail())
                            else res.status(200).json(message.succeed())
                        })
                    }
                })
            }
        }    
    })   
})

router.post('/arrive', (req, res, next) => {
    const {phone, child_uuid} = req.body;
    User.findOne({
        'user.phone': phone,
        'user.role':'parents'
    },(err, user)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else if(!user) res.status(401).json(database_message.no_user_founded())
        else{
            User.findOne({
                'user.uuid': child_uuid,
                'user.role': 'child'
            },(err, user)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else if(!user) res.status(401).json(database_message.no_user_founded())
                else if(!user.user.pickup) res.status(401).json(api_message.child_not_in_pickup_list())
                else{
                    user.user.pickup = false
                    const pickupList_uuid = user.user.pickupList
                    user.save(err=>{
                        if(err) res.status(500).json(database_message.database_fail())
                        else{
                            PickupList.findOne({
                                uuid: pickupList_uuid,
                                done: false
                            },(err, pickupList)=>{
                                if(err) res.status(500).json(database_message.database_fail())
                                else if(!pickupList) res.status(500).json(database_message.lost_pickupList())
                                else{
                                    let number = 0;
                                    for(const i in pickupList.children){
                                        if(pickupList.children[i].uuid ==child_uuid){
                                            number = i
                                        } 
                                    }
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
                                                    done: true
                                                },(err, result)=>{
                                                    if(err) res.status(500).json(database_message.database_fail())
                                                    else res.json(result)
                                                })
                                            }else{
                                                let waypoint_order = direction.waypoint_order.slice();
                                                let place_ids = direction.place_ids.slice();
                                                const index = waypoint_order.indexOf(number)
                                                const length = waypoint_order.length;
                                                waypoint_order = waypoint_order.slice(0,index) +
                                                                waypoint_order.slice(index+1, length)
                                                place_ids = place_ids.slice(0,index) +
                                                            place_ids.slice(index + 1, length)
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
        }    
    })
})

router.get('/getAllPickupChildren',(req,res,next)=>{
    User.find({
        'user.pickup':true,
        'user.role':'child'
    },(err, users)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else{
            const children = users.map(user => {
                return {
                    uuid: user.user.uuid,
                    name: user.user.name
                }
            })
            res.json(children)
        }
    })
})

router.post('/getChildren',(req,res,next)=>{
    const {phone} = req.body;
    User.findOne({
        'user.phone':phone,
        'user.role':'parents'
    },(err,user)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else if(!user) res.status(401).json(database_message.no_user_founded())
        else{
            const children_uuid = user.user.children;
            User.find({
                'user.uuid':{'$in': children_uuid},
                'user.role': 'child'
            },(err, users)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else if(!users) res.status(401).json(database_message.no_user_founded())
                else{
                    const children = users.map(user=>{
                        const {uuid, name, pickup} = user.user
                        return {
                            uuid, 
                            name, 
                            pickup
                        }
                    })
                    res.json(children)
                }
            })
        }
    })
})

module.exports = router;