module.exports = {
    POST:{
        All:["/users/loginByVerificationCode"],
        "/child/add":['principal','teacher'],
        "/child/addParent":['principal','teacher'],
        "/child/arrive":['principal','teacher'],
        "/teacher/add":['principal','teacher'],
        "/driver/add":['principal','teacher'],
        "/pickupList/generatePickupList":['principal'],
        "/pickupList/generateDirection":['driver'],
        "/pickupList/addChildren":['principal','teacher'],
        "/pickupList/removeChildren":['principal','teacher']
    },
    GET:{
        All:[],
        "/child/location":['parent'],
        "/child/allPickupChildren" : ['principal', 'teacher'],
        "/teacher/allTeacher":['principal','teacher'],
        "/driver/allDriver":['principal','teacher'],
        "/driver/checkListStatus":['driver'],
        "/pickupList/":['principal','teacher']
    },
    PUT:{
        All:[],
        "/driver/location":['driver']
    }
}