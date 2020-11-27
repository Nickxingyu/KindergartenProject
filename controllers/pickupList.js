const User = require('../models/database/mongo/DataBase/user');
const PickupList = require('../models/database/mongo/DataBase/pickupList');
const message = require('../models/enum/msg_enum');
const config = require('../config/config.json');

const { v4: uuidv4 } = require('uuid');

module.exports = {
    generatePickupList
}

async function generatePickupList(pickup_lists){
    let result
    try{
        await PickupList.updateMany({status:'wait_for_direction'},{status:'cancel'})
    }catch(e){
        return {
            error: message.Database_fail(e)
        }
    }
    for(let i = 0; i < pickup_lists.length; i++){
        let pickup_list = pickup_lists[i];
        let {child_list} = pickup_list;
        let pickup_list_uuid = uuidv4();
        pickup_list.uuid = pickup_list_uuid;
        pickup_list.status = 'wait_for_direction';
        pickup_list.number = i;
        child_list = child_list.map(child=>{
            const {uuid, address, name, class_number} = child;
            return{
                uuid,
                address,
                remaining_time:"",
                status:"wait",
                name,
                class_number
            }
        })
        pickup_list.child_list = child_list;
        pickup_lists[i] = pickup_list;
    }
    try{
        result = await PickupList.insertMany(pickup_lists)
    }catch(e){
        return {
            error: message.Database_fail(e)
        }
    }
    return result
}
