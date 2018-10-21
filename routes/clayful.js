var express = require('express');
var router = express.Router();
var ProductContents = require('../models/productSchema'); //db를 사용하기 위한 변수
var ClayfulService = require('../service/clayfulService');
var MemberContents = require('../models/memberSchema');
var SmsContents = require('../models/smsSchema'); //db를 사용하기 위한 변수

/*clayful api로부터 받아 상품 업데이트하는 부분*/
router.get('/_updateProduct', function(req, res) {
    var page = req.param('page');
    var limit = req.param('limit');
    if(page == null)
        page = 1;
    if(limit == null)
        limit = 120;
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
                            rawContent.update({_id:rawContent._id}, {$set: {data: elementData, name : elementData.name, updateTime : Date.now()}}, function(err) {
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




router.get('/productList', function(req, res) {
    var page = req.param('page');
    var categoryType = req.param('category');
    if(page == null) {page = 1;}
    if(categoryType == null)
        categoryType = null;

    var skipSize = (page-1)*10;
    var limitSize = 24;
    var pageNum = 1;

    ProductContents.count(function(err, totalCount){
            if(err)
                throw err;
            pageNum = Math.ceil(totalCount/limitSize);

            if(categoryType == null){
                ProductContents.find().sort({createTime:-1}).skip(skipSize).limit(limitSize).exec(function(err, productContents) {
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
                }).sort({createTime:-1}).skip(skipSize).limit(limitSize).exec(function(err, productContents) {
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
        meta : {
            marketing : marketing,
            user_point : 1000
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
                           memberContent.data = JSON.stringify(response);
                           memberContent.save(function(err){
                               res.json({
                                   status : "success",
                                   msg : memberContent
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



module.exports = router;
