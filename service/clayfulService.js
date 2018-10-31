var Clayful = require('clayful');

Clayful.config({
    client: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjA4MTNlYTczM2M5MTI3OGE5NDBjYTc4MWNlZGYxYTU5Njg3NmQ0Y2MwMGQ1NTNjMjllMDc0ZjU4ZWNmODFhZDIiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNTQwNzI2MTkyLCJzdG9yZSI6IktBMlJGRUtIVFhWUS4yUzRLQkRSTkhEM0UiLCJzdWIiOiIyQThVUUpLTThXQUoifQ.NrdB7LwyMd4RTHQaaM2wnC8BSOUEvyYkmRnMbpu0i3I', // 연동 클라이언트 인증 토큰
    debugLanguage: 'ko'
});
var Product = Clayful.Product;
var Customer = Clayful.Customer;
var Cart = Clayful.Cart;

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
    },
    addCart : function(customerId, payload){
        return new Promise(function(resolve, reject){
            Cart.addItem(customerId, payload, function(err, result){
               if(err)
                   reject(err);
               else
                   resolve(result.data);
            });
        });
    },
    checkoutLogin : function(token, payload){
        return new Promise(function (resolve, reject) {
            Cart.checkout(token,'order',payload, function(err, result){
                if(err)
                    reject(err);
                else{
                    console.log(result);
                    resolve(result.data.order);
                }
            });
        });
    }
};




module.exports = self;