const express = require('express');
const router = express.Router();
const {v4:uuidv4} = require('uuid');

const PickupList = require('../models/database/mongo/DataBase/pickupList');
const Direction = require('../models/database/mongo/DataBase/direction')
const User = require('../models/database/mongo/DataBase/user');
const {database_message, message} = require('../models/enum/msg_enum');
const { generateDirection, getDirection } = require('../helpers/GCP/map');    
const { generatePickupList } = require('../controllers/pickupList');

router.post('/generatePickupList', async(req, res, next) => {
    const {pickup_lists} = req.body;
    const result = await generatePickupList(pickup_lists);
    if(result.error){
        const {status, error} = result;
        res.status(status).json(error)
    }else{
        res.json(result)
    }
})

router.post('/generateDirection', async(req, res, next) => {
    const {phone, location} = req.body
    let pickupLists
    let chosen_pickupList
    let number
    let direction
    try{
        pickupLists = await PickupList.find({
            'driver.phone': phone,
            status:{'$in':['on_the_way','wait_for_direction']}
        })
    }catch(e){
        let {status, error} = database_fail(e)
        res.status(status).json(error)
    }
    if(pickupLists.length==0){
        res.json([])
    }else{
        pickupLists.forEach(pickupList=>{
            if(pickupList.status == 'on_the_way'){
                chosen_pickupList = pickupList
            }else if(!number || (number > pickupList.number)){
                chosen_pickupList = pickupList
            }
        })
        const chosen_pickupList_uuid = chosen_pickupList.uuid;
        chosen_pickupList.status = 'on_the_way'
        try{
            await chosen_pickupList.save()
        }catch(e){
            let {status, error} = database_fail(e)
            res.status(status).json(error)
        }
        try{
            direction = await Direction.findOne({pickupList:chosen_pickupList_uuid})
        }catch(e){
            let {status, error} = database_fail(e)
            res.status(status).json(error)
        }
        if(!direction){
            const address_list = chosen_pickupList.child_list.map(child => {
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
                        pickupList: chosen_pickupList_uuid,
                        waypoint_order: direction.routes[0].waypoint_order,
                        place_ids
                    },(err)=>{
                        if(err) res.status(500).json(err)
                        else res.json(direction)
                    })
                }
            })
        }else{
            getDirection(location, direction, (err, direction)=>{
                if(err) res.status(500).json(err)
                else res.json(direction)
            })
        }
    }
})

router.get('/', async(req, res, next)=>{
    let pickupLists
    let pickup_children = []
    let no_pickup = []
    try{
        pickupLists = await PickupList.find({status:{'$in':['wait_for_direction','on_the_way']}})
    }catch(e){
        const {status, error} = database_fail(e)
        res.status(status).json(error)
    }
    pickupLists.forEach(pickupList=>{
        pickupList.child_list.forEach(child=>{
            pickup_children.push(child.uuid)
        })
    })
    try{
        no_pickup = await User.find({'user.uuid':{'$nin':pickup_children},'user.roles':'child'})
    }catch(e){
        const {status, error} = database_fail(e)
        res.status(status).json(error)
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


module.exports = router;

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