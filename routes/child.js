const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const message = require('../models/enum/msg_enum');
const PickupList = require('../models/database/mongo/DataBase/pickupList');
const User = require('../models/database/mongo/DataBase/user');
const Direction = require('../models/database/mongo/DataBase/direction');
const {getPickupStatus, getPickupDay, modifyPickupRule} = require('../controllers/children');

router.post('/addParent',async(req, res, next)=>{
    let {phone, password, name} = req.body
    let user
    try{
        user = await User.findOne({'user.phone':phone})
    }catch(e){
        next(message.Database_fail())
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
            if(err) next(message.Database_fail())
            else res.json(message.OK().msg)
        })
    }else{
        user.user.roles.push('parent')
        try{
            await user.save()
        }catch(e){
            next(message.Database_fail())
        }
        res.json(message.OK().msg)
    }
})

router.post('/add',(req,res,next)=>{
    const uuid = uuidv4()
    let {phone, name, address, class_number, car_number} = req.body;
    let pickupDay = req.body.pickupDay || []
    User.findOne({'user.phone':phone, 'user.roles':'parent'},(err, user)=>{
        if(err) next(message.Database_fail())
        else if(!user) next(message.No_user_found())
        else{
            user.user.children.push(uuid)
            user.save((err, result)=>{
                if(err) next(message.Database_fail())
                else{
                    User.insertMany([
                        {
                            user:{
                                uuid,
                                phone,
                                name,
                                roles: ['child'],
                                address,
                                class_number,
                                pickupDay,
                                car_number
                            }
                        }
                    ],(err, result)=>{
                        if(err) next(message.Database_fail())
                        else res.json(message.OK().msg)
                    })
                } 
            })
        }
    })
})

router.get('/allChildren',(req, res, next)=>{
    User.find({'user.roles':'child'},(err, users)=>{
        if(err) next(message.Database_fail())
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
        let {error}= pickupDay;
        next(error)
    }
    else res.json(pickupDay);
})

router.get('/location', async(req, res, next) => { 
    const {phone} = req.body;
    User.findOne({
        'user.phone':phone,
        'user.roles':'parent'
    },(err, user)=>{
        if(err) next(message.Database_fail())
        else if(!user) next(message.No_user_found())
        else{
            const {children} = user.user;
            User.find({
                'user.uuid': {'$in':children},
                'user.roles': 'child'
            },async(err, children)=>{
                if(err) next(message.Database_fail())
                else{
                    const pickupStatus = await getPickupStatus(children)
                    if(pickupStatus.error) {
                        let {error}= children;
                        next(error)
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
        if(err) next(message.Database_fail())
        else if(!user) next(message.No_user_found())
        else{
            const pickupList_uuid = user.user.pickupList
            PickupList.findOne({
                uuid: pickupList_uuid,
                status: 'on_the_way'
            },async(err, pickupList)=>{
                if(err) next(message.Database_fail())
                else if(!pickupList) next(message.No_user_found())
                else{
                    let number = 0;
                    for(let i = 0; i < pickupList.child_list.length; i++){
                        if(pickupList.child_list[i].uuid == child_uuid){
                            number = i
                            pickupList.child_list[number].status = 'arrive'
                        } 
                    }
                    pickupList.save(err=>{
                        if(err) next(message.Database_fail())
                        else{
                            Direction.findOne({
                                pickupList: pickupList_uuid
                            },(err, direction)=>{
                                if(err) next(message.Database_fail())
                                else if(!direction) next(message.Database_error())
                                else{
                                    if(direction.waypoint_order.length == 1){
                                        PickupList.findOneAndUpdate({
                                            uuid: pickupList_uuid
                                        },{
                                            status: "done"
                                        },(err, result)=>{
                                            if(err) next(message.Database_fail())
                                            else res.json(result)
                                        })
                                    }else{
                                        let waypoint_order = direction.waypoint_order.slice();
                                        let place_ids = direction.place_ids.slice();
                                        const index = waypoint_order.indexOf(number+1)
                                        console.log(index)
                                        const length = waypoint_order.length;
                                        waypoint_order = waypoint_order.slice(0,index).concat(waypoint_order.slice(index+1, length))
                                        place_ids = place_ids.slice(0,index).concat(place_ids.slice(index + 1, length))
                                        Direction.findOneAndUpdate({
                                            pickupList: pickupList_uuid
                                        },{
                                            waypoint_order,
                                            place_ids
                                        },(err, result)=>{
                                            if(err) next(message.Database_fail())
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

router.post('/arriveES', async(req, res, next)=>{
    const {phone} = req.body
    let pickupList, direction
    try{
        pickupList = await PickupList.findOne({'teacher.phone':phone, 'status':'on_the_way'})
    }catch(e){
        next(message.Database_fail(e))
    }
    try{
        direction = await Direction.findOne({'pickupList':pickupList.uuid})
    }catch(e){
        next(message.Database_fail(e))
    }
    const length = direction.waypoint_order.length;
    let waypoint_order = direction.waypoint_order.slice(1, length)
    let place_ids = direction.place_ids.slice(1, length)
    try{
        await Direction.findOneAndUpdate({'pickupList':pickupList.uuid},{waypoint_order, place_ids})
    }catch(e){
        next(message.Database_fail(e))
    }
    res.json(message.OK().msg)
})

router.put('/modifyPickupRule', async(req, res, next)=>{
    const {pickupRule_list} = req.body;
    let result;
    try{
        result = await modifyPickupRule(pickupRule_list);
    }catch(e){
        next(message.Database_fail())
    }
    res.json(message.succeed())
})

module.exports = router;