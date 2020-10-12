const express = require('express');
const router = express.Router();
const {v4:uuidv4} = require('uuid');

const PickupList = require('../models/database/mongo/DataBase/pickupList');
const Direction = require('../models/database/mongo/DataBase/direction')
const User = require('../models/database/mongo/DataBase/user');
const {database_message} = require('../models/enum/msg_enum');
const { generateDirection } = require('../helpers/GCP/map');

router.post('/generatePickupList', (req, res, next) => {
    const {driver, teacher, child_uuid_list} = req.body
    User.find({'user.uuid': {'$in': child_uuid_list}}, (err, users) => {
        if(err) res.status(500).json(database_message.database_fail())
        else {
            const children = users.map(user => { 
                return {
                    uuid: user.user.uuid,
                    address: user.user.address,
                    remaining_time: null
                }
            })
            const uuid = uuidv4();
            PickupList.insertMany([{
                uuid,
                driver:{
                    phone: driver.phone,
                },
                teacher:{
                    phone: teacher.phone
                },
                children,
                done: false
            }], (err, result) => {
                if(err) res.status(500).json(database_message.database_fail())
                else {
                    User.updateMany({
                        'user.uuid': {'$in': child_uuid_list}
                    },{
                        'user.pickupList': uuid
                    },(err)=>{
                        if(err) res.status(500).json(database_message.database_fail())
                        else res.json(result)
                    })
                }
            })
        }
    })
})

router.post('/generateDirection', (req, res, next) => {
    const {phone} = req.body
    PickupList.findOne({
        '$or':[{'driver.phone': phone},{'teacher.phone': phone}],
        done: false
    }, (err, pickupList) => {
        if(err) res.status(500).json(database_message.database_fail())
        else{
            const pickupList_uuid = pickupList.uuid;
            const address_list = pickupList.children.map(child => {
                return child.address
            })
            generateDirection(address_list, (err, direction)=>{
                if(err) res.status(500).json(err)
                else{
                    const place_ids = 
                        direction.geocoded_waypoints
                        .slice(1,direction.geocoded_waypoints.length-1)
                        .map(place=>place.place_id)
                    Direction.insertMany({
                        pickupList: pickupList_uuid,
                        waypoint_order: direction.routes[0].waypoint_order,
                        place_ids
                    },(err)=>{
                        if(err) res.status(500).json(err)
                        else res.json(direction)
                    })
                }
            })
        }
    })
})


module.exports = router;