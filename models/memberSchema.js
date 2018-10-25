var mongoose = require('mongoose');

var memberSchema = mongoose.Schema({
    _id : String,
    name : String,
    phone : String,
    token : String,
    tokenDate : {type: Date, default: Date.now},
    data : String,
    point : {type:Number, default:1000},
    point_history : [{orderid : String,msg : String, date : Date}],
    marketing : {type:Boolean, default: false},
    count : {type:Number, default:0},
    activate : {type:Boolean, default: false}
});

module.exports =  mongoose.model('memberContents', memberSchema);