const User = require('../models/database/mongo/DataBase/user');
const PickupList = require('../models/database/mongo/DataBase/pickupList');

const { v4: uuidv4 } = require('uuid');

module.exports = {
    generatePickupList
}

async function generatePickupList(pickup_lists){
    let result
    try{
        await PickupList.updateMany({status:'wait_for_direction'},{status:'cancel'})
    }catch(e){
        return database_fail(e)
    }
    for(let i = 0; i < pickup_lists.length; i++){
        let pickup_list = pickup_lists[i];
        let {child_list} = pickup_list;
        let pickup_list_uuid = uuidv4();
        pickup_list.uuid = pickup_list_uuid;
        pickup_list.status = 'wait_for_direction';
        pickup_list.number = i;
        child_list = child_list.map(child=>{
            const {uuid, address} = child;
            return{
                uuid,
                address,
                remaining_time:"",
                status:"wait"
            }
        })
        pickup_list.child_list = child_list;
        pickup_lists[i] = pickup_list;
    }
    try{
        result = await PickupList.insertMany(pickup_lists)
    }catch(e){
        return database_fail(e)
    }
    return result
}

async function children_query(children_query_array){
    Promise.all(children_query_array)
}


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
