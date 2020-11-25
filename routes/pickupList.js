const express = require('express');
const router = express.Router();
const {v4:uuidv4} = require('uuid');
const config = require('../config/config.json')

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
    const {phone} = req.body
    const location = req.body.location || config.kindergarten.address
    let pickupLists
    let chosen_pickupList
    let number
    let direction
    try{
        chosen_pickupList = await PickupList.findOne({
            'driver.phone': phone,
            status:{'$in':['on_the_way']}
        })
    }catch(e){
        let {status, error} = database_fail(e)
        res.status(status).json(error)
    }
    if(!chosen_pickupList){
        try{
            pickupLists = await PickupList.find({
                'driver.phone': phone,
                status:{'$in':['wait_for_direction']}
            })
        }catch(e){
            let {status, error} = database_fail(e)
            res.status(status).json(error)
        }
        if(pickupLists.length==0){
            res.json([])
        }else{
            pickupLists.forEach(pickupList=>{
                if(!number || (number > pickupList.number)){
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
        }
    }
    if(chosen_pickupList){
        const chosen_pickupList_uuid = chosen_pickupList.uuid
        try{
            direction = await Direction.findOne({pickupList:chosen_pickupList_uuid})
        }catch(e){
            let {status, error} = database_fail(e)
            res.status(status).json(error)
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
                const {status, error} = database_fail(e)
                res.status(status).json(error)
            }
            generateDirection(address_list, (err, direction)=>{
                if(err) res.status(500).json(err)
                else{
                    const address_order = []
                    const place_ids = 
                        direction.geocoded_waypoints
                        .slice(1,direction.geocoded_waypoints.length-1)
                        .map(place=>place.place_id)
                    for(let i = 0 ; i < direction.routes[0].waypoint_order.length; i++){
                        let index = direction.routes[0].waypoint_order[i]
                        address_order.push(chosen_pickupList.child_list[index].address)
                    }
                    direction.address_order = address_order;
                    Direction.insertMany({
                        pickupList: chosen_pickupList_uuid,
                        waypoint_order: direction.routes[0].waypoint_order,
                        place_ids,
                        address_order
                    },(err)=>{
                        if(err) res.status(500).json(err)
                        else res.json(direction)
                    })
                }
            })
        }else{
            getDirection(location, direction, (err, direction)=>{
                if(err) res.status(500).json(err)
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