const User = require('../models/database/mongo/DataBase/user');
const PickupList = require('../models/database/mongo/DataBase/pickupList');
const message = require('../models/enum/msg_enum');

module.exports = {
    getPickupDay,
    getPickupStatus,
    modifyPickupRule
}

async function getPickupDay(){
    let pickup= []
    let no_pickup = []
    let children = []
    try{
        children = await User.find({'user.roles':'child'});
    }catch(e){
        return {
            error: message.Database_fail()
        }
    }
    children.forEach(child=>{
        const {pickupDay, uuid, name, class_number, address, phone} = child.user
        for(let i = 0; i < 7; i++){
            if(pickupDay[i] !== null){
                let car_number = pickupDay[i]
                let car_array = pickup[i] || []
                let list =  car_array[car_number] || []
                list.push({
                    uuid,
                    phone,
                    name,
                    class_number,
                    address
                })
                car_array[car_number] = list
                pickup[i] = car_array
            }else{
                let list = no_pickup[i] || []
                list.push({
                    uuid,
                    phone,
                    name,
                    class_number,
                    address
                })
                no_pickup[i] = list
            }
        }
    })
    for(let i = 0; i < 7; i++){
        if(!pickup[i]) pickup[i] = []
        if(!no_pickup[i]) no_pickup[i]= []
    }
    for(let i = 0 ; i < 7; i++){
        let tmp = []
        for (let j = 0; j < pickup[i].length; j++){
            if(pickup[i][j]){
                tmp.push(pickup[i][j])
            }
        }
        pickup[i] = tmp
    }
    return {
        pickup,
        no_pickup
    }
}

async function getPickupStatus(children){
    let child_uuid_list = [];
    let pickupList_uuid_list = [];
    let pickupLists = [];
    let pickupStatus = [];
    children.forEach(child=>{
        child_uuid_list.push(child.user.uuid)
        pickupList_uuid_list.push(child.user.pickupList)
    })
    try{
        pickupLists = await PickupList.find({uuid: {'$in':pickupList_uuid_list}})
    }catch(e){
        return {
            error: message.Database_fail()
        }
    }
    children.forEach(child=>{
        let {uuid, name} = child.user
        pickupLists.forEach(pickupList=>{
            if(pickupList.uuid == child.user.pickupList){
                let wait = false
                let remaining_time = null;
                const {location} = pickupList.driver;
                const children_status = pickupList.child_list;
                children_status.forEach(child_status=>{
                    if(child_status.uuid == child.user.uuid) {
                        remaining_time = child_status.remaining_time
                        if(child_status.status == 'wait') wait = true
                    }
                })
                if(wait)
                    pickupStatus.push({
                        uuid,
                        name,
                        remaining_time,
                        location
                    })
            }
        })
    })
    return pickupStatus
}

async function modifyPickupRule(pickupRule_list){
    let query_array = []
    pickupRule_list.forEach(pickupRule=>{
        if(pickupRule.pickupDays && pickupRule.car_number){
            query_array.push(User.updateOne(
                {'user.uuid':pickupRule.uuid},
                {
                    'user.pickupDay':pickupRule.pickupDays,
                    'user.car_number':pickupRule.car_number
                }
            ))
        }else if(!pickupRule.pickupDays){
            query_array.push(User.updateOne({'user.uuid':pickupRule.uuid},{'user.car_number':pickupRule.car_number}))
        }else{
            query_array.push(User.updateOne({'user.uuid':pickupRule.uuid},{'user.pickupDay':pickupRule.pickupDays}))
        }
    })
    Promise.all(query_array)
}