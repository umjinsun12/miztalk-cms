var request = require('request');

var self={
    sendSms : function(OTP, mobileNo){
        var options = {
            url : 'https://apis.aligo.in/send/',
            method : 'POST',
            form : {
                key : 'tugm5qzoith1lf9hhejpg8yazn86ngt7',
                userid : 'miztalk',
                sender : '01023802040',
                receiver : mobileNo,
                msg : '미즈톡 모바일 인증번호 [' + OTP + '] 입니다. 인증번호를 입력해 주세요',
                title : '미즈톡 인증'
            }
        };
        return new Promise(function(resolve, reject){
            request(options, function(err, response, body){
                try{
                    var resp = JSON.parse(body);
                    if(resp.result_code != 1)
                        reject(resp);
                    else
                        resolve(resp);
                }catch (e) {
                    reject(e);
                }
            });
        });
    },
    generateOtp:function(){
        return Math.floor(Math.random() * 10000);
    }
};

module.exports = self;