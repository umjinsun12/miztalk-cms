var express = require('express');
var BoardContents = require('../models/boardsSchema'); //db를 사용하기 위한 변수
var request = require('request');
var fs = require('fs');
var multer = require('multer'); // 파일 저장을 위한  multer
var upload = multer({dest:'./tmp/'}); // multer 경로 설정, 파일이 업로드 되면 먼저 임시 폴더로 가서 저장됨
var router = express.Router();

router.get('/', function(req,res){

    var page = req.param('page');
    if(page == null) {page = 1;}

    var skipSize = (page-1)*10;
    var limitSize = 10;
    var pageNum = 1;

    BoardContents.count({deleted:false},
        function(err, totalCount){
        // db에서 날짜 순으로 데이터들을 가져옴
        if(err)
            throw err;

        pageNum = Math.ceil(totalCount/limitSize);
        BoardContents.find({deleted:false}).sort({date:-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
            if(err) throw err;
            res.json({
                title: "Board",
                contents: pageContents,
                pagination: pageNum,
                searchWord: ''
            });
        });
    });
});

router.get('/search', function(req, res){
    // 글 검색하는 부분
    var search_word = req.param('searchWord');
    var searchCondition = {$regex:search_word};

    var page = req.param('page');
    if(page == null) {page = 1;}
    var skipSize = (page-1)*10;
    var limitSize = 10;
    var pageNum = 1;

    BoardContents.count({deleted:false, $or:[{title:searchCondition},{contents:searchCondition},{writer:searchCondition}]},function(err, searchCount){
        if(err) throw err;
        pageNum = Math.ceil(searchCount/limitSize);

        BoardContents.find({deleted:false, $or:[{title:searchCondition},{contents:searchCondition},{writer:searchCondition}]}).sort({date:-1}).skip(skipSize).limit(limitSize).exec(function(err, searchContents){
            if(err) throw err;

            res.json({
                title: "Board",
                contents: searchContents,
                pagination: pageNum,
                searchWord: search_word
            });
        });
    });
});


router.post('/', upload.array('UploadFile'),function(req, res){
    //field name은 form의 input file의 name과 같아야함
    // 글 작성하고 submit하게 되면 저장이 되는 부분
    // 글 수정하고 submit하면 수정된 결과가 저장되는 부분
    var mode = req.param('mode');

    var addNewTitle = req.body.addContentSubject;
    var addNewWriter;
    var addNewContent = req.body.addContents;
    var userToken = req.body.userToken;
    var upFile = req.files; // 업로드 된 파일을 받아옴
    if(addNewTitle == undefined  || addNewContent == undefined || userToken == undefined)
        throw new Error('fail_parameter_null');

    var modTitle = req.body.modContentSubject;
    var modContent = req.body.modContents;
    var modId = req.body.modId;

    validateToken(userToken).then(function(data){
        if(mode == 'add') {
            addNewWriter = data.user.display_name; // 유저 데이터를 신뢰하지 않는다.
            if (isSaved(upFile)) { // 파일이 제대로 업로드 되었는지 확인 후 디비에 저장시키게 됨
                addBoard(addNewTitle, addNewWriter, addNewContent, upFile);
                res.json({
                    status : 'success',
                    msg : 'success_write_post'
                });
            } else {
                res.json({
                    status : 'fail',
                    msg : 'fail_file_saveerr'
                });
            }
        } else {
            modBoard(modId, modTitle, modContent);
            res.json({
                status : 'success',
                msg : 'success_modify_post'
            });
        }
    }).catch(function(err){
        res.json({
            status : 'fail',
            msg :err
        });
        throw new Error(err);
    });
});

router.post('/test', function(req, res){
    var userToken = req.body.userToken;

    var headers = {
        'Authorization' : 'Bearer ' + userToken
    };

    var options = {
        url : 'http://miztalk.kr/wp-json/jwt-auth/v1/token/validate_userid?token='  + userToken,
        method : 'POST',
        headers : headers
    };

    request(options, function(err, response, body){
        res.json(JSON.parse(body));
    });
});



router.get('/image/:path', function(req, res){
    // file download
    var path = req.params.path;
    res.download('./upload/'+path, path);
    console.log(path);
});

router.post('/reply', function(req, res){
    // 댓글 다는 부분
    var reply_comment = req.body.replyComment;
    var reply_id = req.body.replyId;
    if(reply_comment == undefined || reply_id == undefined )
        throw new Error('fail_parameter_null');

    validateToken(userToken).then(function(data) {
        reply_writer = data.user.display_name; // 유저 데이터를 신뢰하지 않는다.
        addComment(reply_id, reply_writer, reply_comment);
        res.json({
            status: 'success',
            msg: 'success_reply_post'
        });
    }).catch(function(err){
        res.json({
            status : 'fail',
            msg :err
        });
        throw new Error(err);
    });
});

router.post('/likes', function(req, res){
    // 댓글 다는 부분
    var reply_id = req.body.likesId;
    if(reply_id == undefined)
        throw new Error('fail_parameter_null');

    validateToken(userToken).then(function(data) {
        var reply_writer = data.user.display_name;
        BoardContents.findOne({_id: reply_id}, function(err, rawContent){
            if(err) throw err;
            var likechk = rawContent.likeslist.indexOf(reply_writer);

            if(likechk == -1 || likechk == undefined){
                BoardContents.update({_id: reply_id}, {$push: {likeslist: reply_writer}}, function (err) {
                    if (err) throw err;
                    res.json({
                        status : 'success',
                        msg : 'success_reply_post'
                    });
                });
            }else{
                throw new Error('fail_already_likes');
            }
        });
    }).catch(function(err){
        res.json({
            status : 'fail',
            msg :err
        });
        throw new Error(err);
    });
});


router.get('/reply', function(req, res) {
    // 댓글 ajax로 페이징 하는 부분
    var id = req.param('id');
    var page = req.param('page');
    var max = req.param('max'); // 댓글 총 갯수 확인
    var skipSize = (page-1)*5;
    var limitSize = skipSize + 5;

    if(max < skipSize+5) {limitSize = max*1;} // 댓글 갯수 보다 넘어가는 경우는 댓글 수로 맞춰줌 (몽고디비 쿼리에서 limit은 양의 정수여야함)

    BoardContents.findOne({_id: id}, {comments: {$slice: [skipSize, limitSize]}} , function(err, pageReply){
        if(err) throw err;
        res.send(pageReply.comments);
    });
});

router.get('/delete', function(req, res) {
    // 삭제하는 부분

    var contentId = req.param('id');

    BoardContents.update({_id:contentId}, {$set:{deleted:true}}, function(err){
        if(err) throw err;
        res.json({
            status : 'success',
            msg : 'success_post_delete'
        });
    });
});

router.get('/view', function(req, res){
    // 글 보는 부분. 글 내용을 출력하고 조회수를 늘려줘야함
    // 댓글 페이지 추가 해줌, 5개씩 출력함

    var contentId = req.param('id');

    BoardContents.findOne({_id:contentId}, function(err, rawContent){
        if(err) throw err;
        rawContent.count += 1;
        var reply_pg = Math.ceil(rawContent.comments.length/10);

        rawContent.save(function(err){
            if(err) throw err;

            res.json({
                    title: "Board",
                    content:rawContent,
                    replyPage: reply_pg
                });
        });
    })
});



module.exports = router;


function validateToken(userToken){
    var headers = {
        'Authorization' : 'Bearer ' + userToken
    };

    var options = {
        url : 'http://miztalk.kr/wp-json/jwt-auth/v1/token/validate_userid?token='  + userToken,
        method : 'POST',
        headers : headers
    };
    return new Promise(function(resolve, reject){
        request(options, function(err, response, body){
             var resp = JSON.parse(body);
             if(resp.data.status != 200)
                 reject(resp);
             else
                 resolve(resp);
        });
    });
}

function addBoard(title, writer, content, upFile){
    var newContent = content.replace(/\r\n/gi, "\\r\\n");

    var newBoardContents = new BoardContents;
    newBoardContents.writer = writer;
    newBoardContents.title = title;
    newBoardContents.contents = newContent;

    newBoardContents.save(function (err) {
        if (err) throw err;
        BoardContents.findOne({_id: newBoardContents._id}, {_id: 1}, function (err, newBoardId) {
            if (err) throw err;

            if (upFile != null) {
                var renaming = renameUploadFile(newBoardId.id, upFile);

                for (var i = 0; i < upFile.length; i++) {
                    fs.rename(renaming.tmpname[i], renaming.fsname[i], function (err) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                    });
                }

                for (var i = 0; i < upFile.length; i++) {
                    BoardContents.update({_id: newBoardId.id}, {$push: {image: renaming.fullname[i]}}, function (err) {
                        if (err) throw err;
                    });
                }
            }
        });
    });
}

function modBoard(id, title, content) {
    var modContent = content.replace(/\r\n/gi, "\\r\\n");

    BoardContents.findOne({_id:id}, function(err, originContent){
        if(err) throw err;
        originContent.updated.push({title: originContent.title, contents:originContent.contents});
        originContent.save(function(err){
            if(err) throw err;
        });
    });

    BoardContents.update({_id:id}, {$set: {title: title, contents: modContent, date: Date.now()}}, function(err) {
        if(err) throw err;
    });
}

function addComment(id, writer, comment) {
    BoardContents.findOne({_id: id}, function(err, rawContent){
        if(err) throw err;

        rawContent.comments.unshift({name:writer, memo: comment});
        rawContent.save(function(err){
            if(err) throw err;
        });
    });
}

function getFileDate(date) {
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();

    var fullDate = year+""+month+""+day+""+hour+""+min+""+sec;

    return fullDate
}

function renameUploadFile(itemId,upFile){
    // 업로드 할때 리네이밍 하는 곳!
    var renameForUpload = {};
    var newFile = upFile; // 새로 들어 온 파일
    var tmpPath = [];
    var tmpType = [];
    var index = [];
    var rename = [];
    var fileName = [];
    var fullName = []; // 다운로드 시 보여줄 이름 필요하니까 원래 이름까지 같이 저장하자!
    var fsName = [];

    for (var i = 0; i < newFile.length; i++) {
        tmpPath[i] = newFile[i].path;
        tmpType[i] = newFile[i].mimetype.split('/')[1]; // 확장자 저장해주려고!
        index[i] = tmpPath[i].split('/').length;
        rename[i] = tmpPath[i].split('\\')[index[i] - 1];
        fileName [i] = itemId + "_" + getFileDate(new Date()) + "_" + rename[i] + "." + tmpType[i]; // 파일 확장자 명까지 같이 가는 이름 "글아이디_날짜_파일명.확장자"
        fullName [i] = fileName[i] + ":" + newFile[i].originalname.split('.')[0]; // 원래 이름까지 같이 가는 이름 "글아이디_날짜_파일명.확장자:보여줄 이름"
        fsName [i] = getDirname(1)+"upload/"+fileName[i]; // fs.rename 용 이름 "./upload/글아이디_날짜_파일명.확장자"
    }

    renameForUpload.tmpname = tmpPath;
    renameForUpload.filename = fileName;
    renameForUpload.fullname = fullName;
    renameForUpload.fsname = fsName;

    return renameForUpload;
}

function getDirname(num){
    //원하는 상위폴더까지 리턴해줌. 0은 현재 위치까지, 1은 그 상위.. 이런 식으로
    // 리네임과, 파일의 경로를 따오기 위해 필요함.

    var order = num;
    var dirname = __dirname.split('/');
    var result = '';

    for(var i=0;i<dirname.length-order;i++){
        result += dirname[i] + '/';
    }

    return result;
}

function isSaved(upFile) {
    // 파일 저장 여부 확인해서 제대로 저장되면 디비에 저장되는 방식

    var savedFile = upFile;
    var count = 0;

    if(savedFile != null) { // 파일 존재시 -> tmp폴더에 파일 저장여부 확인 -> 있으면 저장, 없으면 에러메시지
        for (var i = 0; i < savedFile.length; i++) {
            if(fs.statSync(getDirname(1) + savedFile[i].path).isFile()){ //fs 모듈을 사용해서 파일의 존재 여부를 확인한다.
                count ++; // true인 결과 갯수 세서
            };

        }
        if(count == savedFile.length){  //올린 파일 갯수랑 같으면 패스
            return true;
        }else{
            return false;
        }
    }else{ // 파일이 처음부터 없는 경우
        return true;
    }
}