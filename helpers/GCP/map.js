const {Client} = require("@googlemaps/google-maps-services-js");
const client = new Client({});
const key = require('../../config/config.json').google.Map_Api_Key;
const kindergarten_address = require('../../config/config.json').kindergarten.address;

function getDirection(location, direction, callback){
    const waypoints = direction.place_ids.map(place_id => {
        return "place_id:"+place_id
    })
    return client.directions({
        params:{
            origin: location,
            destination: kindergarten_address,
            waypoints: waypoints,
            optimize: false,
            key
        },
        timeout: 3000
    }).then(result=>{
        let result_json = result.data
        result_json.address_order = direction.address_order
        return callback(null, result_json)
    }).catch(err=>{
        console.log(err)
        return callback(err)
    })
}

function generateDirection(address_list, callback){
    return client.directions({
        params:{
            origin: kindergarten_address,
            destination: kindergarten_address,
            waypoints: address_list,
            optimize: true,
            key
        },
        timeout: 3000
    }).then(result=>{
        const result_json = result.data
        return callback(null, result_json)
    })
    .catch(err=>{
        return callback(err)
    })
}

function computeRemainingTime(places, callback){
    return client.distancematrix({
        params:{
            origins: places,
            destinations: places,
            key
        },
        timeout:3000
    }).then(result=>{
        const origins = result.data.rows;
        const remaining_time = [];
        let time_sum = 0;
        for(let i = 0; i < origins.length - 1; i++){
            time_sum = time_sum + origins[i].elements[i+1].duration.value;
            remaining_time.push(time_sum)
        }
        return callback(null, remaining_time)
    }).catch(err=>{
        return callback(err)
    })
}

module.exports = {
    generateDirection,
    computeRemainingTime,
    getDirection
}