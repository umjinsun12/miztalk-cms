var Clayful = require('clayful');

Clayful.config({
    client: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjA4MTNlYTczM2M5MTI3OGE5NDBjYTc4MWNlZGYxYTU5Njg3NmQ0Y2MwMGQ1NTNjMjllMDc0ZjU4ZWNmODFhZDIiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNTQwNzI2MTkyLCJzdG9yZSI6IktBMlJGRUtIVFhWUS4yUzRLQkRSTkhEM0UiLCJzdWIiOiIyQThVUUpLTThXQUoifQ.NrdB7LwyMd4RTHQaaM2wnC8BSOUEvyYkmRnMbpu0i3I', // 연동 클라이언트 인증 토큰
    debugLanguage: 'ko'
});
var Product = Clayful.Product;
var Customer = Clayful.Customer;
var Cart = Clayful.Cart;
var Order = Clayful.Order;

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
            console.log(payload);
            Cart.checkout(token,'order',payload, function(err, result){
                if(err)
                    reject(err);
                else{
                    console.log(result);
                    resolve(result.data.order);
                }
            });
        });
    },
    getOrder : function(orderid){
        return new Promise(function(resolve, reject){
            Order.get(orderid, function(err, result){
               if(err)
                   reject(err);
               else{
                   resolve(result.data);
               }
            });
        });
    },
    loginSns : function(vendor){
        console.log(vendor);
        return new Promise(function(resolve, reject){
            Customer.authenticateBy3rdParty(vendor, function(err, result){
                if(err)
                    throw err;
                else
                    resolve(result.data.redirect);
            });
        });
    },
    getCart : function(payload, options){
        return new Promise(function(resolve, reject){
            Cart.getForMe(payload, options, function(err, result){
                if(err)
                    reject(err);
                else
                    resolve(result.data.cart);
            });
        });
    },
    deleteCartItem : function(itemId, options){
        return new Promise(function(resolve, reject){
            Cart.deleteItemForMe(itemId, options, function(err, result){
                if(err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    },
    addCartItem : function(payload, options){
        return new Promise(function(resolve, reject){
           Cart.addItemForMe(payload, options, function(err, result){
              if(err)
                  reject(err);
              else
                  resolve(result);
           });
        });
    },
    getOrder : function(id, options){
        return new Promise(function(resolve, reject){
           Order.getForMe(id, options, function(err, result){
               if(err)
                   reject(err);
               else
                   resolve(result);
           });
        });
    },
    getAsNonRegisteredForMe : function(payload){
        return new Promise(function(resolve, reject){
            Cart.getAsNonRegisteredForMe(payload, function(err, result){
                if(err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    },
    checkoutAsNonRegisteredForMe : function(payload){
        return new Promise(function(resolve, reject){
            Cart.checkoutAsNonRegisteredForMe('order', payload, function(err, result){
                if(err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
};




module.exports = self;