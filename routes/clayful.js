var express = require('express');
var router = express.Router();
var ProductContents = require('../models/productSchema'); //db를 사용하기 위한 변수
var ClayfulService = require('../service/clayfulService');
var SmsService = require('../service/smsService');
var MemberContents = require('../models/memberSchema');
var SmsContents = require('../models/smsSchema'); //db를 사용하기 위한 변수
var js2xmlparser = require('js2xmlparser');

/*clayful api로부터 받아 상품 업데이트하는 부분*/
router.get('/_updateProduct', function(req, res) {
    var page = req.param('page');
    var limit = req.param('limit');
    if(page == null)
        page = 1;
    if(limit == null)
        limit = 120;
    ProductContents.remove({}, function(err){
        if(err) throw err;

        ClayfulService.productList(page,limit).then(function(result){
            var processCount = 0;
            var dataLength = result.data.length;
            if(dataLength != 0){
                result.data.forEach(function(elementData){
                    ProductContents.findOne({_id: elementData._id},function(err, rawContent){
                        if(err) throw err;
                        if(rawContent==null){
                            var newProductContents = new ProductContents;
                            newProductContents._id = elementData._id;
                            newProductContents.data = JSON.stringify(elementData);
                            newProductContents.name = elementData.name;
                            if(elementData.collections.length > 0){
                                elementData.collections.forEach(function(categoryData){
                                    newProductContents.category.push(categoryData.path[0].slug);
                                });
                            }
                            newProductContents.save(function (err) {
                                if (err) throw err;
                                processCount++;
                                if(processCount >= dataLength)
                                    res.json(result);
                            });
                        }else{
                            console.log(rawContent);
                            MemberContents.update({_id:rawContent._id}, {$set: {data: elementData, name : elementData.name, updateTime : Date.now()}}, function(err) {
                                if(err) throw err;
                                if(elementData.collections.length > 0){
                                    rawContent.category = [];
                                    for(var i=0 ; i < elementData.collections.length ; i++){
                                        rawContent.category.push(elementData.collections[i].path[0].slug);
                                    }
                                }
                                rawContent.save(function(err){
                                    if(err) throw err;
                                    processCount++;
                                    if(processCount >= dataLength)
                                        res.json(result)
                                });
                            });
                        }
                    });
                });
            }else{
                res.json({
                    status : "error",
                    msg : "end of data"
                });
            }
        }).catch(function(err){
            res.json(err);
        });

    });
});




router.get('/productList', function(req, res) {
    var page = req.param('page');
    var categoryType = req.param('category');
    if(page == null) {page = 1;}
    if(categoryType == null)
        categoryType = null;

    var skipSize = (page-1)*24;
    var limitSize = 24;
    var pageNum = 1;

    ProductContents.count(function(err, totalCount){
            if(err)
                throw err;
            pageNum = Math.ceil(totalCount/limitSize);

            if(categoryType == null){
                ProductContents.find().sort({createTime:1}).skip(skipSize).limit(limitSize).exec(function(err, productContents) {
                    if(err) throw err;
                    res.json({
                        title: "Product",
                        contents: productContents,
                        pagination: pageNum,
                        searchWord: ''
                    });
                });
            }
            else{
                ProductContents.find({
                    'category' : {
                        $in : [
                            categoryType
                        ]}
                }).sort({createTime:1}).skip(skipSize).limit(limitSize).exec(function(err, productContents) {
                    if(err) throw err;
                    res.json({
                        title: "Product",
                        contents: productContents,
                        pagination: pageNum,
                        searchWord: ''
                    });
                });
            }
    });
});

router.get('/getProduct', function(req, res){
    var product_id = req.param('id');
    if(product_id == null){
        res.json({
            status : "error",
            msg : "null_param"
        });
    }else{
        ProductContents.findOne({_id: product_id},function(err, rawContent){
            if(err) throw err;
            res.json(rawContent);
        });
    }
});


router.post('/_memberLogin', function(req, res){
    var id = req.body.id;
    var usertoken = req.body.token;
    if(id==null || usertoken == null){
        res.json({
            status : "error",
            msg : "null_param"
        });
    }
    console.log("usertoken : " + usertoken);
    MemberContents.findOne({_id: id},function(err, memberContent){
        if(err)
            throw err;
        if(memberContent==null){
            ClayfulService.getCustomer(usertoken).then(function(data){
                console.log(data);
                var newMemberContents = new MemberContents;
                newMemberContents._id = data._id;
                newMemberContents.token = usertoken;
                newMemberContents.data = JSON.stringify(data);
                newMemberContents.save(function (err) {
                    if (err) throw err;
                    res.json({
                        status : 'success',
                        msg : data
                    })
                });
            }).catch(function(err){
                res.json({
                    status : "error",
                    msg : "token_err"
                })
            });
        }else{
            ClayfulService.getCustomer(usertoken).then(function(data){
                MemberContents.update({_id: data._id}, {$set: {data : JSON.stringify(data), token: usertoken, tokenDate : Date.now()}}, function(err) {
                    if(err) throw err;
                    console.log("db token : " + memberContent.token);

                    res.json({
                        status : 'success',
                        msg : data
                    });
                }).catch(function(err){
                    res.json({
                        status : "error",
                        msg : err
                    })
                });
            }).catch(function(err){
                res.json({
                    status: "error",
                    msg : "token_err"
                })
            });
        }
    });
});

router.post('/memberCheck', function(req, res){
    var id = req.body.id;
    var token = req.body.token;
    if(id == null || token == null){
        res.json({
            status : "error",
            msg : "null_param"
        });
    }
    MemberContents.findOne({_id: id},function(err, memberContent){
        if(memberContent == null){
            res.json({
                status : "error",
                msg : "none_member"
            })
        }else{
            if(memberContent.token == token){
                if(memberContent.phone == null){
                    res.json({
                       status : "error",
                       msg : "none_phone"
                    });
                }else{
                    res.json({
                       status : "success",
                       msg : memberContent
                    });
                }
            }
            else{
                res.json({
                    status : "error",
                    msg : "token_mismatch"
                })
            }
        }
    });
});

router.post('/nicknameCheck', function(req, res){
    var user_name = req.body.name;
    if(user_name == null){
        res.json({
            status : "error",
            msg : "null_param"
        });
    }

    MemberContents.findOne({name:user_name},function(err, memberContent){
       if(err) throw err;
       if(memberContent == null){
           res.json({
              status : "success",
              msg : "none"
           });
       }else{
           res.json({
               status : "error",
               msg : "already"
           });
       }
    });
});

router.post('/_memberReg', function(req, res){
    var phone = req.body.phone;
    var id = req.body.id;
    var token = req.body.token;
    var name = req.body.name;
    var marketing = req.body.marketing;

    var payload = {
        phone : phone,
        alias : name,
        name : {
            full : name
        }
    };
    SmsContents.findOne({phonenum: phone}, function (err, rawContent) {
        if(err) throw err;
       if(rawContent == null){
           res.json({
               status : "error",
               msg : "none_phone"
           });
       }else{
           ClayfulService.updateCustomer(payload, token).then(function(response){
               console.log(response);
               SmsContents.findOne({phonenum: phone}, function (err, rawContent) {
                   rawContent.activate = true;
                   rawContent.username = name;
                   rawContent.save(function (err) {
                       MemberContents.findOne({_id:id}, function(err, memberContent){
                           memberContent.name = name;
                           memberContent.phone = phone;
                           memberContent.marketing = marketing;
                           memberContent.user_point = 1000;
                           memberContent.data = JSON.stringify(response);
                           memberContent.save(function(err){
                               res.json({
                                   status : "success",
                                   msg : response
                               });
                           });
                       });
                   });
               });
           }).catch(function(err){
               console.log(err);
               res.json({
                   status : "error",
                   msg : err
               })
           });

       }
    });
});


router.post('/checkoutLogin', function(req, res){
    var payload = JSON.parse(req.body.payload);
    var productList = JSON.parse(req.body.productList);
    var userid = req.body.id;
    var userPoint = req.body.userPoint;
    var userp = userPoint;
    var discountProduct = [];

    if(payload == null || productList == null || userid == null){
        res.json({
            status : "error",
            msg : "null_param"
        })
    }

    if(userPoint == undefined || userPoint == null){
        userPoint = 0;
        userp = 0;
    }

    MemberContents.findOne({_id : userid}, function(err, memberContent){
        if(err) throw err;
        if(memberContent == null){
            res.json({
                status : "error",
                msg : "none_user"
            })
        }else{
            if(memberContent.point < userPoint){
                res.json({
                  status : "error",
                  msg : "none_point"
                })
            }else{
                for(var i=0 ;i < productList.length ; i++){
                    if(parseInt(userPoint) < 100)
                        break;
                    if(productList[i].price >= userPoint){
                        var discounts = [];
                        var dis10000 = parseInt(userPoint/10000) * 10000;
                        var dis1000 = parseInt((userPoint-dis10000)/1000) * 1000;
                        var dis100 = parseInt((userPoint-dis10000-dis1000)/100) * 100;
                        if(dis10000)
                            discounts.push(String(dis10000));
                        if(dis1000)
                            discounts.push(String(dis1000));
                        if(dis100)
                            discounts.push(String(dis100));
                        discountProduct.push({
                            item : productList[i].id,
                            discounts:discounts
                        });
                        userPoint = 0;
                        break;
                    }else{
                        var discounts = [];
                        var dis10000 = parseInt(productList[i].price/10000) * 10000;
                        var dis1000 = parseInt((productList[i].price-dis10000)/1000) * 1000;
                        var dis100 = parseInt((productList[i].price-dis10000-dis1000)/100) * 100;
                        if(dis10000)
                            discounts.push(String(dis10000));
                        if(dis1000)
                            discounts.push(String(dis1000));
                        if(dis100)
                            discounts.push(String(dis100));
                        discountProduct.push({
                            item : productList[i].id,
                            discounts:discounts
                        });
                        userPoint = userPoint - productList[i].price;
                    }
                }
                if(discountProduct.length != 0){
                    payload.discount = {
                        items : discountProduct
                    };
                }
                ClayfulService.checkoutLogin(userid, payload).then(function(result){
                    memberContent.point = memberContent.point - userp;
                    memberContent.point_history.push({orderid : result._id ,msg : userp, date : new Date()});
                    memberContent.save(function (err) {
                        if(err) throw err;
                    });
                    res.json(result);
                }).catch(function(reject){
                    console.log(reject);
                });
            }
        }
    });
});


router.get('/getPoint', function(req, res){
    var userid = req.param('id');
    MemberContents.findOne({_id : userid}, function(err, memberContent){
        if(err) throw err;
        console.log(memberContent);
       if(memberContent == null){
           res.json({
               status : "error",
               msg : "none_user"
           });
       }else{
           res.json({
               status : "success",
               msg : memberContent.point
           });
       }
    });
});

router.get('/setAdminUserPoint', function(req, res){
    var userid = req.param('id');
    var point = req.param('point');
    MemberContents.findOne({_id : userid}, function(err, memberContent){
       if(err) throw err;
       console.log(memberContent);
       if(memberContent == null){
           res.json({
               status : "error",
               msg : "none_user"
           });
       }else{
           MemberContents.point = parseInt(point);
           MemberContents.save(function(err){
              if(err) throw err;
               res.json({
                   status : "success"
               });
           });
       }
    });
});


router.post('/sendSms', function(req, res){
     var params = req.body.params;
     if(params == null){
         res.json({
            status : "fail sendSms"
         });
     }

     ClayfulService.getOrder(params.orderId).then(function (result) {
         SmsService.sendKakao(result).then(function(result){
             console.log(result);
            res.json({
                status : "success"
            })
         });
     });
});


router.get('/loginSns', function(req, res){
    var vendor = req.param('vendor');
    ClayfulService.loginSns(vendor).then(function(result){
        res.json({
            status : "success",
            redirect : result
        });
    });
});

router.post('/getCart', function(req, res){
    var payload = req.body.payload;
    var options = req.body.options;

    ClayfulService.getCart(payload, options).then(function(result){
        res.json({
            status : "success",
            cart : result
        });
    });
});

router.post('/addCartItem', function(req, res){
    var payload = req.body.payload;
    var options = req.body.options;
    ClayfulService.addCartItem(payload, options).then(function(result){
        res.json(result);
    });
});

router.post('/deleteCartItem', function(req, res){
    var itemId = req.body.itemId;
    var options = req.body.options;
    ClayfulService.deleteCartItem(itemId, options).then(function(result){
        res.json(result);
    });
});

router.post('/getOrder', function(req, res){
    var id = req.body.id;
    var options = req.body.options;
    ClayfulService.getOrder(id, options).then(function(result){
        res.json(result);
    });
});


router.post('/getAsNonRegisteredForMe', function(req, res){
   var payload = req.body.payload;
   ClayfulService.getAsNonRegisteredForMe(payload).then(function(result){
       res.json(result);
   });
});

router.post('/checkoutAsNonRegisteredForMe',function(req, res){
    var payload = req.body.payload;
    ClayfulService.checkoutAsNonRegisteredForMe(payload).then(function(result){
       res.json(result);
    });
});


router.post('/updateUser', function(req,res){
    var username = req.body.name;
    var userid = req.body.id;
    ClayfulService.customerUpdate(userid, username);
    res.json({
        "status" : "success"
    })
});

router.post('/orderList', function(req,res){
    var options = req.body.options;
    ClayfulService.orderListForMe(options).then(function(result){
        res.json(result);
    });
});

router.post('/addWishlist', function(req, res){
   var userId = req.body.id;
   var productId = req.body.productId;
    MemberContents.findOne({_id: userId},function(err, memberContent){
        memberContent.wishlist.push(productId);
        memberContent.save(function(err){
            if(err) throw err;
            res.json({
               status : "success",
                data : memberContent.wishlist
            });
        });
    });
});

router.post('/deleteWishlist', function(req, res){
    var userId = req.body.id;
    var productId = req.body.productId;
    MemberContents.findOne({_id: userId},function(err, memberContent){
        for(var i= 0 ; i < memberContent.wishlist.length ; i++){
            if(memberContent.wishlist[i] == productId){
                memberContent.wishlist.splice(i, 1);
                break;
            }
        }
        memberContent.save(function(err){
            if(err) throw err;
            res.json({
                status : "success",
                data : memberContent.wishlist
            });
        });
    });
});

router.get('/getWishlist', function(req, res){
    var userId = req.param('id');
    MemberContents.findOne({_id: userId},function(err, memberContent){
        res.json({
           status : "success",
           data : memberContent.wishlist
        });
    });
});


router.get('/naverPay', function(req, res){
    var req_product = req.param('product');

    var products = [];
    var findId = [];

    for(var i=0 ; i < req_product.length ; i++){
        findId.push(req_product[i]['id']);
    }

    ProductContents.find({_id: {$in: findId}}, function(err, result){
        for(var i=0; i < result.length ; i++){
            var productData = JSON.parse(result[i].data);
            var naver_shipping = productData.shipping.methods[0].name.split('_');
            var naver_param = {
                id : productData._id,
                name : productData.name,
                basePrice : productData.price.sale.raw,
                taxType : 'TAX_FREE', //TAX or TAX_FREE
                infoUrl : "http://hotdealelf.com/#/tabs/%ec%87%bc%ed%95%91/shopping/" + productData._id,
                imageUrl : productData.thumbnail.url,
                status : 'ON_SALE',
                shippingPolicy : {
                    groupId : "shipping-a",
                    method : "DELIVERY", //DELIVERY(택배·소포·등기), QUICK_SVC(퀵 서비스), DIRECT_DELIVERY(직접 전달), VISIT_RECEIPT(방문 수령), NOTHING(배송 없음)
                    baseFee : naver_shipping[0],
                    feeRule : {
                        surchargesByArea : [ //array or string(API)
                            {area:"island", surcharge:naver_shipping[1]},
                            {area:"jeju", surcharge:naver_shipping[1]}
                        ]
                    },
                    feePayType : "PREPAYED" //PREPAYED(선불), CASH_ON_DELIVERY(착불)
                }
            };

            if(productData.variants.length > 1){
                naver_param.basePrice = 0;
                naver_param.optionSupport = true;
                var combinationItem = [];
                var optionItem = {
                    type : 'SELECT',
                    name : '종류',
                    value : []
                };
                for(var j=0 ; j < productData.variants.length ; j++){
                    if(productData.variants[j].types.length != 0){
                        optionItem.value.push({
                            id : productData.variants[j].types[0].variation._id,
                            text : productData.variants[j].types[0].variation.value
                        });
                        combinationItem.push({
                            manageCode :  productData.variants[j].types[0].variation._id,
                            options : [{
                                name : productData.variants[j].types[0].variation.value,
                                id : productData.variants[j].types[0].variation._id
                            }]
                        });
                    }
                }


                naver_param.option = {
                    optionItem : optionItem,
                    combination : combinationItem
                };
            }
            products.push(naver_param);
        }
        res.set('Content-Type', 'text/xml');
        res.send(js2xmlparser.parse("products",{'product':products }));
    });
});

module.exports = router;
