var schedule = require('node-schedule');
var request = require('request');
var express = require('express');
var BoardContents = require('../models/boardsSchema'); //db를 사용하기 위한 변수

var WORDPRESS_REST_API_URL = "http://genjo1517.cafe24.com";

var scheduler = schedule.scheduleJob("*/5 * * * * *", function() {

        getPosts().then(function(res){
            res.forEach(function(post){
                addPost(post.id);
            }, function(err){
               console.log(err);
            });
        });
});


function getPosts(){

    var options = {
        url : WORDPRESS_REST_API_URL + '/wp-json/wp/v2/posts/?per_page=100',
        method : 'GET'
    };
    return new Promise(function(resolve, reject){
        request(options, function(err, response, body){
            try{
                var resp = JSON.parse(body);
                resolve(resp);
            }catch(err){
                reject(err);
            }
        });
    });
}

function addPost(postid){
    var category = 9091;

    var newBoardContents = new BoardContents;
    newBoardContents.category = category;
    newBoardContents.postid = postid;

    try{
        BoardContents.findOne({postid:postid, category: category}, function(err, rawContent) {
            if (err) throw err;
            if (rawContent == null || rawContent == undefined){
                newBoardContents.save(function (err) {
                    if (err) throw err;
                    console.log("add post id : " + postid);
                });
            }
        });
    }catch (e) {
        console.log(e);
    }
}
