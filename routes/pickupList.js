const express = require('express');
const router = express.Router();
const {v4:uuidv4} = require('uuid');

const PickupList = require('../models/database/mongo/DataBase/pickupList');
const Direction = require('../models/database/mongo/DataBase/direction')
const User = require('../models/database/mongo/DataBase/user');
const config = require('../config/config.json');
const message = require('../models/enum/msg_enum');
const { generateDirection, getDirection } = require('../helpers/GCP/map');    
const { generatePickupList } = require('../controllers/pickupList');

router.post('/generatePickupList', async(req, res, next) => {
    const {pickup_lists} = req.body;
    const result = await generatePickupList(pickup_lists);
    if(result.error){
        next(result.error)
    }else{
        res.json(result)
    }
})

router.post('/generateDirection', async(req, res, next) => {
    let {phone, location} = req.body
    let pickupLists
    let chosen_pickupList
    let number
    let direction
    location = location || config.kindergarten.address
    try{
        chosen_pickupList = await PickupList.findOne({
            'driver.phone': phone,
            status:{'$in':['on_the_way']}
        })
    }catch(e){
        next(message.Database_fail(e))
    }
    if(!chosen_pickupList){
        try{
            pickupLists = await PickupList.find({
                'driver.phone': phone,
                status:{'$in':['wait_for_direction']}
            })
        }catch(e){
            next(message.Database_fail(e))
        }
        if(pickupLists.length!=0){
            pickupLists.forEach(pickupList=>{
                if(!number || (number > pickupList.number)){
                    chosen_pickupList = pickupList
                }
            })
            chosen_pickupList.status = 'on_the_way'
            try{
                await chosen_pickupList.save()
            }catch(e){
                next(message.Database_fail(e))
            }
        }
    }
    if(chosen_pickupList){
        const chosen_pickupList_uuid = chosen_pickupList.uuid
        try{
            direction = await Direction.findOne({pickupList:chosen_pickupList_uuid})
        }catch(e){
            next(message.Database_fail(e))
        }
        if(!direction){
            let child_uuid_array = []
            const address_list = chosen_pickupList.child_list.map(child => {
                child_uuid_array.push(child.uuid)
                return child.address
            })
            try{
                await User.updateMany(
                    {'user.uuid':{'$in':child_uuid_array}},
                    {'user.pickupList':chosen_pickupList_uuid}
                )
            }catch(e){
                next(message.Database_fail(e))
            }
            generateDirection(address_list, (err, direction)=>{
                if(err) next(err)
                else{
                    const place_ids = 
                        direction.geocoded_waypoints
                        .slice(0,direction.geocoded_waypoints.length-1)
                        .map(place=>place.place_id)
                    const waypoint_order = [0].concat(
                        direction.routes[0].waypoint_order
                        .map(order=>order+1)
                    )
                    Direction.insertMany({
                        pickupList: chosen_pickupList_uuid,
                        waypoint_order,
                        place_ids
                    },(err)=>{
                        if(err) next(message.Database_fail(err))
                        else{
                            getDirection(location, {place_ids}, (err, direction)=>{
                                if(err) next(err)
                                else {
                                    res.json(direction)
                                }
                            })
                        }
                    })
                }
            })
        }else{
            getDirection(location, direction, (err, direction)=>{
                if(err) next(err)
                else {
                    res.json(direction)
                }
            })
        }
    }else{
        res.json({})
    }
})

router.get('/', async(req, res, next)=>{
    let pickupLists
    let pickup_children = []
    let no_pickup = []
    try{
        pickupLists = await PickupList.find({status:{'$in':['wait_for_direction','on_the_way']}})
    }catch(e){
        next(message.Database_fail(e))
    }
    pickupLists.forEach(pickupList=>{
        pickupList.child_list.forEach(child=>{
            pickup_children.push(child.uuid)
        })
    })
    try{
        no_pickup = await User.find({'user.uuid':{'$nin':pickup_children},'user.roles':'child'})
    }catch(e){
        next(message.Database_fail(e))
    }
    no_pickup = no_pickup.map(child=>{
        const {uuid, name, address, class_number} = child.user
        return {
            uuid,
            name,
            address,
            class_number
        }
    })
    res.json({
        pickup_lists: pickupLists,
        no_pickup
    })
})

router.post('/addChildren', async(req, res, next)=>{
    const {day, car, child_list} = req.body
    let children
    try{
        children = await User.find({'user.uuid':{'$in':child_list}})
    }catch(e){
        next(message.Database_fail(e))
    }
    children = children.map(async child=>{
        let {pickupDay, uuid} = child.user ;
        pickupDay[day] = car || 0;
        return User.updateOne({'user.uuid': uuid},{'$set':{'user.pickupDay':pickupDay}})
    })
    try{
        await Promise.all(children)
        res.json(message.OK().msg)
    }catch(e){
        next(message.Database_fail(e))
    }
})

router.post('/removeChildren', async(req, res, next)=>{
    const {day, child_list} = req.body
    let children
    try{
        children = await User.find({'user.uuid':{'$in':child_list}})
    }catch(e){
        next(message.Database_fail(e))
    }
    children = children.map(child=>{
        let {pickupDay, uuid} = child.user ;
        pickupDay[day] = null;
        return User.updateOne({'user.uuid': uuid},{'$set':{'user.pickupDay':pickupDay}})
    })
    try{
        await Promise.all(children)
        res.json(message.OK().msg)
    }catch(e){
        next(message.Database_fail(e))
    }
})

module.exports = router;
