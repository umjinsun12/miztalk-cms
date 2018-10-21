var Clayful = require('clayful');

Clayful.config({
    client: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImM2NWRhYTNiYWM1MjZmOTRlOWY2YmZmYzYyMTc1ZGZiODU4NTRhMzllZGIwYjljOGZmNzllZWMwZGQwNGQzM2IiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNTM5ODc2MTE0LCJzdG9yZSI6IktBMlJGRUtIVFhWUS5LNjdGN0tHRk4yRzQiLCJzdWIiOiI5SzRGWlpaUFdHV1YifQ.ScJFSxSrWjZl5WqLeCSXD9FyETebcnEGCDaVTA4_pcI', // 연동 클라이언트 인증 토큰
    debugLanguage: 'ko'
});
var Product = Clayful.Product;
var Customer = Clayful.Customer;

var self = {
    productList : function(pages, limits){
        var options = {
            query : {
                page : pages,
                limit : limits
            }
        };
        return new Promise(function(resolve, reject){
            Product.list(options,function(err, result){
                if(err)
                    reject(err);
                else{
                    resolve(result);
                }
            });
        });
    },
    getCustomer : function(token){
        var options = {
                customer: token
        };
        return new Promise(function(resolve, reject){
            Customer.getMe(options, function(err, result){
                if(err)
                    reject(err);
                else
                    resolve(result.data);
            });
        });
    },
    updateCustomer : function(payload,token){
        var options = {
            customer: token
        };
        return new Promise(function(resolve, reject){
            Customer.updateMe(payload, options, function(err, result){
                if(err)
                    reject(err);
                else
                    resolve(result.data);
            });
        });
    }
};




module.exports = self;