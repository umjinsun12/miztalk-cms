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
    sendAccount : function(mobileNo,price){
        var options = {
            url : 'https://apis.aligo.in/send/',
            method : 'POST',
            form : {
                key : 'tugm5qzoith1lf9hhejpg8yazn86ngt7',
                userid : 'miztalk',
                sender : '01023802040',
                receiver : mobileNo,
                msg : '미즈톡 기업은행[069-113975-04-017] 예금주 브이티커머스 유우상 [' + price +']원을 입금해주세요.',
                title : '미즈톡 무통장입금'
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
    },
    sendKakao : function(orderData){
        var productName = orderData.items[0].product.name;
        if(orderData.items.length > 1)
            productName += "외 " + String(orderData.items.length-1) + "개";
        var options = [{
            url : 'https://alimtalk-api.bizmsg.kr/v2/sender/send/',
            method : 'POST',
            headers: {
                'content-type': 'application/json',
                'userId' : 'miztalk'
            },
            form : {
                message_type : 'at',
                phn : '82' + orderData.customer.mobile.slice(1),
                profile : '2e1e7cc1a4b228206cd18625ed4caba567dc9464',
                tmplId : 'messge01_buy',
                reserveDt : '00000000000000',
                msg : "미즈톡 " + orderData.customer.name.full + " 주문이 완료되었습니다. \n * 구매자 전화번호 : " +  orderData.customer.mobile + " \n * 주문일자 : " + orderData.createdAt.formatted +
                    " \n * 상품명(수량) : " + productName + " (주문번호 : " + orderData._id + ") \n * 결제금액 : " + orderData.total.price.sale.formatted +" \n * 배송지 : "
                    + orderData.address.shipping.address1 + orderData.address.shipping.address2 + " \n * * 주문취소/배송조회 문의: 010-2380-2040"
            }
        }];

        console.log(options);

        return new Promise(function(resolve, reject){
            request(options, function(err, response, body){
                try{
                    var resp = JSON.parse(body);
                    console.log(resp);
                    if(resp.result_code != 1)
                        reject(resp);
                    else
                        resolve(resp);
                }catch (e) {
                    console.log(e);
                    reject(e);
                }
            });
        });
    }
};

module.exports = self;