const express = require('express');
const router = express.Router();
const PickupList = require('../models/database/mongo/DataBase/pickupList');
const Direction = require('../models/database/mongo/DataBase/direction');
const {computeRemainingTime} = require('../helpers/GCP/map');
const { database_message, message } = require('../models/enum/msg_enum');


router.get('/getAllDriver',(req, res, next)=>{
    User.find({
        'user.role':'driver'
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

router.post('/setLocation', (req, res, next) => {
    const {phone, location} = req.body
    const {0:lat, 1:lng} = location.split(',');
    PickupList.findOne({
        '$or':[{'driver.phone': phone},{'teacher.phone': phone}],
        done: false
    }, (err, pickupList) => {
        if(err) res.status(500).json(err)
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
                        const new_children_status = pickupList.children.slice();
                        new_driver_status.location = {
                            lat,lng
                        };
                        for (const i in waypoint_order){
                            new_children_status[waypoint_order[i]]
                            .remaining_time = remaining_time_array[i];
                        }
                        PickupList.findOneAndUpdate({uuid: pickupList_uuid},{
                            driver: new_driver_status,
                            children: new_children_status
                        },(err)=>{
                            if(err) res.status(500).json(database_message.database_fail())
                            else res.json(message.succeed())
                        })
                    }
                })
            })
        }
    })
})

module.exports = router;