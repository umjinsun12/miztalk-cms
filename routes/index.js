var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});


router.get('/version', function(req,res){
    res.json({
        status : 'success',
        version : '1.2'
    });
});

module.exports = router;
