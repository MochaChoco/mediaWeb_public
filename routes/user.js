const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const awsConfig = require('../auth/awsConfig.js');
const mongoClient = require('mongodb').MongoClient;
const mongoObjectId = require('mongodb').ObjectId;
const mongoDBUrl = require('../DB/mongoDBInfo.js').getURL();
const client = new mongoClient(mongoDBUrl, { useNewUrlParser: true });
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: __dirname + '/temp/' })  // 파일이 저장되는 디렉토리

aws.config.update(awsConfig.getKey());

client.connect(err => {
});

  // 현재 세션을 판단하여 세션이 일치하면 이메일과 프로필 사진 정보를 클라이언트로 보냄
router.post('/checkSession', function(req, res){
  const collection = client.db("auth").collection("sessions");
  collection.findOne({_id : req.session.id}, function(err, result){
    if(err)
      throw err;
    else{
      if(result != undefined){
        const obj = JSON.parse(result.session);
        if(req.session.isLogined != undefined){
          if((req.session.isLogined == true) && (req.session.name == obj.name)){
            var info = {};
            info.email = req.session.email;
            info.profileImage = req.session.profileImage;
            info.myScrap = req.session.myScrap;
            info.myMovieVote = req.session.myMovieVote;
            info.myCommentVote = req.session.myCommentVote;
            info.myCommentHistory = req.session.myCommentHistory;
            info.myWatchHistory = req.session.myWatchHistory;
            res.send(info);
          } else { // 세션은 유효하나 서버의 세션 로그인 정보와 클라이언트의 쿠키 로그인 정보가 다름
            console.log("세션 정보 불일치");
            res.send(false);
          }
        } else{
          console.log("로그인 정보 없음");
          res.send(false);
        }
      } else {
        console.log("유효 세션 없음");
        res.send(false);
      }
    }
  });
});

  // 로그아웃 요청 처리
router.get('/logOutUser', function(req, res){
  const collection = client.db("userList").collection("info");
  collection.deleteOne({_id : req.session.id}, function(err, result){
    if(err)
      throw err;
    else{
      if(result != undefined){
        console.log("logout!");
        req.session.destroy(function(err){
          if(!err)
            res.send(true);
          else
            res.send(false);
        });
      } else {
        res.send(false);
      }
    }
  });
});

  // 프로필 사진 업로드 요청 시 처리
router.post('/submitProfileImage', upload.single('profileIconImage'), function(req, res){
  const collection = client.db("userList").collection("info");
  const s3 = new aws.S3();
  const filePath = "./routes/temp/" + req.file.filename;
  const params = {
    Bucket: awsConfig.getBucket(),
    Body : fs.createReadStream(filePath),
    Key : "profileImage/" + Date.now() + "_" + req.file.filename
  };

  s3.upload(params, function (err, data) {
      //handle error
    if (err) {
      console.log("upload failed", err);
      res.send(false);
    } else{ // temp 폴더에 임시로 생성했던 업로드용 이미지를 삭제해줌
      fs.unlink(filePath, function (err) {
        if (err) {
          console.error("Temp file delect error!", err);
          res.send(false);
        }
      });

      collection.updateOne({email: req.body.email}, {$set:{profileImage: awsConfig.getCloudFront() + params.Key}}, function(err, result){
        if(err)
          throw err;
        else{
          if(result == undefined){
            console.log("유저 정보 없음!!!");
            res.send(false);
          } else{
            req.session.profileImage = awsConfig.getCloudFront() + params.Key;
            let data = {
              profileImage: awsConfig.getCloudFront() + params.Key
            }
            res.send(data);
          }
        }
      });
    }
  });
});

router.post('/setWatchHistory', function(req, res){
  const size = 10;
  const userCollection = client.db("userList").collection("info");
  userCollection.findOne({email: req.body.userEmail}, function(err, result){
    let history = result.myWatchHistory;
    if(result.myWatchHistory.length == 0)
      history = [];

    const date = new Date, post = {};
    post.movieTitle = req.body.movieTitle;
    post.fileUrl = req.body.fileUrl;
    post.id = req.body.id;
    post.readingTime = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    history.push(post);

    if(history.length > size)
      history.shift();

    userCollection.findOneAndUpdate({email: req.body.userEmail}, {$set: {myWatchHistory: history}}, {returnOriginal : false}, function(err, result){
      if(err)
        throw err;
      else{
        if(result.value){
          req.session.myWatchHistory = result.value.myWatchHistory;
          res.send(result.value);
        } else{
          console.log("일치하는 유저 정보가 없습니다.");
        }
      }
    });
  });
});

router.post('/manageScrap', function(req, res){
  const collection = client.db("userList").collection("info");
  collection.findOne({$and:[{name: req.body.userName, email: req.body.email}]}, function(err, result){
    if(err)
      throw err;
    else{
      if(result){
        let isOverlap = false;
        for(let i = 0 ; i < Object.keys(result.myScrap).length ; i++){
          if(Object.keys(result.myScrap)[i] == req.body.movieId){
            isOverlap = true;
            break;
          }
        }

        let scrap, query;
        if(isOverlap){  // 해당 스크랩이 현재 중복되는지 검사
          scrap = result.myScrap; // 중복되면 유저 정보에서 해당 스크랩 정보를 지우고 덮어쓴다.
          delete scrap[req.body.movieId];
          query = 'myScrap';
        } else{
          scrap = {};
          scrap.fileUrl = req.body.fileUrl;
          scrap.thumbnail = req.body.thumbnail;
          query = 'myScrap.' + req.body.movieId;
        }

        collection.findOneAndUpdate({_id: result._id}, {$set: {[query] : scrap}}, {returnOriginal : false}, function(err, result){
          if(err)
            throw err;
          else{
            if(result.value){
              req.session.myScrap = result.value.myScrap;
              res.send(req.session.myScrap);
            } else{
              res.send(false);
            }
          }
        });
      } else {
        console.log("일치하는 유저 정보 없음");
        res.send(false);
      }
    }
  });
});

router.post('/manageMovieVote', function(req, res){
  const userCollection = client.db("userList").collection("info");
  const movieCollection = client.db("movieList").collection("info");
  userCollection.findOne({email: req.body.userEmail}, function(err, result){
    if(err)
      throw err;
    else{
      if(result) {
        const data = {};
        let isOverlap = false;
        let i;
        for(let i = 0 ; i < Object.keys(result.myMovieVote).length ; i++){
          if(Object.keys(result.myMovieVote)[i] == req.body.movieId){
            isOverlap = true;
            break;
          }
        }

        let count, movieVote, query;
        if(isOverlap){  // 해당 좋아요 정보가 현재 중복되는지 검사
          movieVote = result.myMovieVote; // 중복되면 유저 정보에서 해당 좋아요 정보를 지우고 덮어쓴다.
          delete movieVote[req.body.movieId];
          count = -1;
          query = 'myMovieVote';
        } else {
          movieVote = {};
          movieVote.fileUrl = req.body.fileUrl;
          movieVote.thumbnail = req.body.thumbnail;
          count = 1;
          query = 'myMovieVote.' + req.body.movieId;
        }

        userCollection.findOneAndUpdate({email: req.body.userEmail}, {$set: {[query] : movieVote}}, {returnOriginal : false}, function(err, result){
          if(err)
            throw err;
          else{
            if(result.value){
              req.session.myMovieVote = result.value.myMovieVote;
              data.movieVote = req.session.myMovieVote;
              // 영화 db에서 vote 수 갱신
            movieCollection.findOneAndUpdate({_id: mongoObjectId(req.body.movieId)}, {$inc: {_voteCount: count}}, {returnOriginal : false}, function(err, result){
              if(err)
                throw err;
              else{
                if(result.value){
                  data.movieInfo = result.value;
                  res.send(data);
                } else {
                  res.send(false);
                }
              }
            });
            } else{
              res.send(false);
            }
          }
        });
      } else{
        console.log("일치하는 유저 정보 없음");
        res.send(false);
      }
    }
  });
});

module.exports = router;
