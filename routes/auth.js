const express = require('express');
const router = express.Router();
const mongoClient = require('mongodb').MongoClient;
const mongoDBUrl = require('../DB/mongoDBInfo.js').getURL();
const client = new mongoClient(mongoDBUrl, { useNewUrlParser: true });
const sanitizeHtml = require('sanitize-html');

client.connect(err => {
});

  // 회원가입 요청시 처리
router.post('/signUpProcess', function(req, res){
  const collection = client.db("userList").collection("info");
  var userInfo = {
   name: sanitizeHtml(req.body.name),
   email: sanitizeHtml(req.body.email),
   password: sanitizeHtml(req.body.password),
   profileImage: '',
   myScrap: {},
   myMovieVote: {},
   myCommentVote: {},
   myCommentHistory: [],
   myWatchHistory: []
  };

  // 어차피 1개라도 중복되면 가입 시키면 안되므로 findOne 사용
  collection.findOne({$or:[{name: userInfo.name}, {email: userInfo.email}]}, function(err, result){
    if(err)
      throw err;
    else{
      if(result != undefined){
        console.log("중복 닉네임 또는 아이디 발견");
          res.send(false);
        } else {
          collection.insertOne(userInfo, function(err) {
          if(err)
            throw err;
          else{
             console.log("회원 가입 완료");
             res.send(true);
          }
        });
      }
    }
  });
});

  // 로그인 요청 시 처리
router.post('/loginProcess', function(req, res){
  const collection = client.db("userList").collection("info");
  collection.findOne({$and:[{email: sanitizeHtml(req.body.email), password: sanitizeHtml(req.body.password)}]}, function(err, result){
    if(err)
      throw err;
    else{
      if(result == undefined){
        res.send(false);
      } else {
          // 세션 설정
        req.session.isLogined = true;
        req.session.email = result.email;
        req.session.name = result.name;
        req.session.profileImage = result.profileImage;
        req.session.myScrap = result.myScrap;
        req.session.myMovieVote = result.myMovieVote;
        req.session.myCommentVote = result.myCommentVote;
        req.session.myCommentHistory = result.myCommentHistory;
        req.session.myWatchHistory = result.myWatchHistory;
        req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;

          // 클라이언트로 보낼 데이터 설정
        var info = {};
        info.email = result.email;
        info.name = result.name;
        info.profileImage = result.profileImage;
        info.myScrap = result.myScrap;
        info.myMovieVote = result.myMovieVote;
        info.myCommentVote = result.myCommentVote;
        info.myCommentHistory = result.myCommentHistory;
        info.myWatchHistory = result.myWatchHistory;
        res.send(info);
      }
    }
  });
});

module.exports = router;
