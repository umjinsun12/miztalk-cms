var mongoose = require('mongoose');

var smsSchema = mongoose.Schema({
    phonenum: String,
    date: {type: Date, default: Date.now},
    otp : String,
    count : {type:Number, default:0},
    activate : {type:Boolean, default: false}
});

module.exports =  mongoose.model('smsContents', smsSchema);