var express = require('express');
var SmsContents = require('../models/smsSchema'); //db를 사용하기 위한 변수
var SmsService = require('../service/smsService');

var router = express.Router();


router.get('/activateOtp', function(req, res){
    var phonenum = req.param('phonenum');
    var username = req.param('username');

    SmsContents.findOne({phonenum: phonenum}, function (err, rawContent) {
        rawContent.activate = true;
        rawContent.username = username;

        rawContent.save(function (err) {
            res.json({
                msg : err,
                status : 200
            });
        });
    });
});

router.get('/sendAccount', function(req, res){
   var phonenum = req.param('phonenum');
   var price = req.param('price');
   SmsService.sendAccount(phonenum, price).then(function(result){
       res.json({
           msg : 'success_create',
           status : 200
       });
   }).then(function(err){
       res.json({
           msg : 'fail_create',
           status : 200
       });
   });
});


router.get('/verifyOtp', function(req, res){
    var phonenum = req.param('phonenum');
    var usercode = req.param('code');
    SmsContents.findOne({phonenum: phonenum}, function (err, rawContent) {
       if(err) throw err;
       if(rawContent == null){
           res.json({
               msg : 'fail_notcreate',
               status : 201
           });
       }
       else if(rawContent.activate == true){
           res.json({
              msg : 'already_activate',
               status : 201
           });
       }
       else{
           var otpDate = rawContent.date;
           var nowDate = new Date();
           var elapsed  = (nowDate.getTime() - otpDate.getTime())/1000;
           console.log(elapsed);
           if(elapsed >= 90){
               res.json({
                   msg : 'session_expired',
                   status : 201
               });
           }else{
               if(usercode == rawContent.otp){
                   rawContent.save(function (err) {
                       if(err) throw err;
                       res.json({
                           msg : 'success_activate',
                           status : 200
                       });
                   });
               }else{
                   res.json({
                      msg : 'wrong_code',
                      status : 201
                   });
               }
           }
       }
    });
});


router.get('/sendOtp', function(req, res){
    var phonenum = req.param('phonenum');
    var otp = SmsService.generateOtp();
    SmsContents.findOne({phonenum: phonenum}, function(err, rawContent){
        if (err) throw err;
        if(rawContent == null){
            try{
                var newSmsContents = new SmsContents;
                newSmsContents.phonenum = phonenum;
                newSmsContents.otp = otp;
                newSmsContents.save(function (err) {
                    if(err) throw err;
                    SmsService.sendSms(otp, phonenum).then(function (result) {
                        console.log(result);
                        res.json({
                            msg : 'success_create',
                            status : 200
                        });
                    }).catch(function(err) {
                        if(err){
                            res.json({
                                msg : 'fail_create',
                                status : 201
                            });
                            throw err;
                        }
                    });
                });
            }catch (e) {
                throw e;
            }
        }
        else if(rawContent.activate == true){
            res.json({
               msg : 'already_activate',
               status : 201
            });
        }
        else{
            console.log(rawContent); // 문자 이미 보냈을때
            var otpDate = rawContent.date;
            var nowDate = new Date();
            var elapsed  = (nowDate.getTime() - otpDate.getTime())/1000;
            console.log(elapsed);
            if(elapsed >= 10){ //10초 지난 경우 Count 체크하고 다시  보내기 가능
                if(rawContent.count >= 5){ //5회가 지났을 경우엔 5분뒤
                    if(elapsed >= 300){ // 300 초 지난 경우
                        rawContent.count = 0;
                        rawContent.otp = otp;
                        rawContent.date = new Date();
                        rawContent.save(function (err) {
                           if(err) throw err;
                           SmsService.sendSms(otp, phonenum).then(function(result){
                               console.log(result);
                               res.json({
                                   msg : 'success_create',
                                   status : 200
                               });
                           }).catch(function(err){
                               if(err){
                                   res.json({
                                       msg : 'fail_create',
                                       status : 201
                                   });
                                   throw err;
                               }
                           });
                        });
                    }else{
                        res.json({
                            msg : 'reject_fail',
                            status : 201
                        });
                    }
                }else{ //5회 가 안 지낫을때 다시 보냄
                    rawContent.count += 1;
                    rawContent.otp = otp;
                    rawContent.date = new Date();
                    rawContent.save(function(err){
                        if(err) throw err;
                        SmsService.sendSms(otp, phonenum).then(function(result){
                            console.log(result);
                            res.json({
                                msg : 'success_update',
                                status : 200
                            });
                        }).catch(function(err){
                            if(err){
                                res.json({
                                    msg : 'fail_update',
                                    status : 201
                                });
                                throw err;
                            }
                        });
                    });
                }
            }else{ // 120초 안됐을때 이미 발급
                res.json({
                    msg : 'already_sendotp',
                    status : 201
                });   
            }
        }
    });
});



module.exports = router;