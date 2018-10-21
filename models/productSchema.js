var mongoose = require('mongoose');

var productSchema = mongoose.Schema({
    _id : String,
    name : String,
    category: [String],
    count : Number,
    data : String,
    updateTime : {type: Date, default: Date.now},
    createTime : {type: Date, default: Date.now}
});

module.exports =  mongoose.model('productContents', productSchema);