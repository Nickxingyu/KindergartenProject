const express = require('express');
const router = express.Router();
const PickupList = require('../models/database/mongo/DataBase/pickupList');
const Direction = require('../models/database/mongo/DataBase/direction');
const User = require('../models/database/mongo/DataBase/user');
const {computeRemainingTime, getDirection} = require('../helpers/GCP/map');
const { database_message, message, api_message } = require('../models/enum/msg_enum');
const {v4:uuidv4} = require('uuid');

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
                        roles: ['driver']
                    }
                }
            ],(err, result)=>{
                if(err) res.status(500).json(database_message.database_fail())
                else res.json(message.succeed())
            })
        }else{
            user.user.roles.push('driver')
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

router.get('/allDriver',(req, res, next)=>{
    User.find({
        'user.roles':'driver'
    },(err, users)=>{
        if(err) res.status(500).json(database_message.database_fail())
        else{
            const drivers = users.map(user=>{
                const {uuid, name, phone} = user.user
                return {
                    uuid,
                    name,
                    phone
                }
            })
            res.json(drivers)
        }
    })
})

router.put('/location', (req, res, next) => {
    const {phone, location} = req.body
    const {0:lat, 1:lng} = location.split(',');
    PickupList.findOne({
        'driver.phone': phone,
        status: 'on_the_way'
    }, (err, pickupList) => {
        if(err) res.status(500).json(err)
        else if(!pickupList) res.json([])
        else{
            const pickupList_uuid = pickupList.uuid;
            Direction.findOne({pickupList: pickupList_uuid},(err, direction)=>{
                if(err) res.status(500).json(err)
                const {waypoint_order} = direction;
                const place_ids = direction.place_ids.map(place_id => 'place_id:'+place_id)
                const places = [location];
                for(const i in place_ids){
                    places.push(place_ids[i])
                }
                computeRemainingTime(places,(err, remaining_time_array) => {
                    if(err) res.status(500).json(err)
                    else{
                        const new_driver_status = pickupList.driver;
                        const new_children_status = pickupList.child_list.slice();
                        new_driver_status.location = {
                            lat,lng
                        };
                        for (const i in waypoint_order){
                            new_children_status[waypoint_order[i]]
                            .remaining_time = remaining_time_array[i];
                        }
                        PickupList.findOneAndUpdate({uuid: pickupList_uuid},{
                            driver: new_driver_status,
                            child_list: new_children_status
                        },(err)=>{
                            if(err) res.status(500).json(database_message.database_fail())
                            else {
                                getDirection(location, direction, (err, direction)=>{
                                    if(err) res.status(500).json(err)
                                    else res.json(direction)
                                })
                            }
                        })
                    }
                })
            })
        }
    })
})

module.exports = router;