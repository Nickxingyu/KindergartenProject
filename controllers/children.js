const User = require('../models/database/mongo/DataBase/user');
const PickupList = require('../models/database/mongo/DataBase/pickupList');

module.exports = {
    getPickupDay,
    getPickupStatus,
    modifyPickupDays
}

async function getPickupDay(){
    let pickup= []
    let no_pickup = []
    let children = []
    try{
        children = await User.find({'user.roles':'child'});
    }catch(e){
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
    children.forEach(child=>{
        const {pickupDay, uuid, name, class_number, address, phone} = child.user
        const car_number = child.user.car_number || 0;
        for(let i = 0; i < 7; i++){
            if(pickupDay[i]){
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
    children.forEach(child=>{
        let {uuid, name} = child.user
        pickupLists.forEach(pickupList=>{
            if(pickupList.uuid == child.user.pickupList){
                let remaining_time = null;
                const {location} = pickupList.driver;
                const children_status = pickupList.child_list;
                children_status.forEach(child_status=>{
                    if(child_status.uuid == child.user.uuid) remaining_time = child_status.remaining_time
                })
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

async function modifyPickupDays(pickupDays_list){
    let query_array = []
    pickupDays_list.forEach(pickupDays=>{
        query_array.push(User.updateOne({'user.uuid':pickupDays.uuid},{'user.pickupDay':pickupDays.pickupDays}))
    })
    Promise.all(query_array)
}