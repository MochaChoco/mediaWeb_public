const express = require('express');
const aws = require('aws-sdk');
const awsConfig = require('./auth/awsConfig.js');
const session = require('express-session');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const portNum = 8081;
const mongoClient = require('mongodb').MongoClient;
const mongoObjectId = require('mongodb').ObjectId;
const mongoDBUrl = require('./DB/mongoDBInfo.js').getURL();
const client = new mongoClient(mongoDBUrl, { useNewUrlParser: true });
const sessionInfo = require('./auth/sessionInfo.js').getSessionInfo(client);
const multer = require('multer');
const upload = multer({ dest: __dirname + '/temp/' })  // 파일이 저장되는 디렉토리
const fallback = require('express-history-api-fallback');
const root = __dirname + "/dist";
const sanitizeHtml = require('sanitize-html');

app.use(express.static(root));
app.use(fallback('index.html', { root }));
app.use(bodyParser.json());
app.use(session(sessionInfo));

aws.config.update(awsConfig.getKey());

client.connect(err => {
  collection = client.db("movieList").collection("info");
  setTimeout(setCategoryHot, 1000);   // mongoDB 관련 변수가 초기화되고 나서 불러주도록 설정
  setTimeout(setCategoryNew, 5000);
  setInterval(setCategoryHot, 3600000);   // 1시간마다 좋아요 수에 따른 인기 영화 목록 갱신
  setInterval(setCategoryNew, 86400000);   // 24시간마다 최신 영화 목록 갱신

  // perform actions on the collection object
//  client.close();
});

app.get('*', function(req, res, next){
//  console.log("session id : " + req.session.id + " // name : " + req.session.name + " // email : " + req.session.email);
  next();
});

app.post('*', function(req, res, next){
//  console.log("session id : " + req.session.id + " // name : " + req.session.name + " // email : " + req.session.email);
  next();
});

  // 영화 전체 정보를 불러옴
app.get('/api/getMovieInfo', (req, res) => {
  collection.find().toArray(function(err, result) {
    if(err)
      throw err;
    else{
      if(result != undefined){
        result[0]._comment = checkComment(result[0]._comment);  // 유저가 삭제처리한 댓글은 내용을 지우고 클라이언트로 전송한다.
        res.send(result);
      } else {
        res.send(false);
      }
    }
  });
});

  // 현재 세션을 판단하여 세션이 일치하면 이메일과 프로필 사진 정보를 클라이언트로 보냄
app.post('/api/checkSession', function(req, res){
  var collection = client.db("auth").collection("sessions");
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
app.get('/api/logOutUser', function(req, res){
  var collection = client.db("userList").collection("info");
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

  // 현재 페이지에 맞는 영화 정보를 불러옴
app.post('/api/getWatchMovieOne', function(req, res){
  collection.findOne({_id : mongoObjectId(req.body.id)}, function(err, result){
    if(err)
      throw err;
    else{
      if(result != undefined){
        res.send(result);
      } else {
        res.send(false);
      }
    }
  });
});

  // 조회수 갱신
app.post('/api/updateViewingCount', function(req, res){
  collection.findOneAndUpdate({_id : mongoObjectId(req.body.id)}, {$inc: {_viewingCount: 1}}, {returnOriginal : false}, function(err, documents){
    if(err)
      throw err;
    else{
      res.send({result : documents.value});
    }
  });
});

  // 회원가입 요청시 처리
app.post('/api/auth/signUpProcess', function(req, res){
  var collection = client.db("userList").collection("info");
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
app.post('/api/auth/loginProcess', function(req, res){
  var collection = client.db("userList").collection("info");
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

  // 프로필 사진 업로드 요청 시 처리
app.post('/api/myInfo/submitProfileImage', upload.single('profileIconImage'), function(req, res){
  var collection = client.db("userList").collection("info");
  var s3 = new aws.S3();
  var filePath = "./temp/" + req.file.filename;
  var params = {
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

app.post('/api/watch/writeComment', function(req, res){
  const size = 10;
  var authCollection = client.db("auth").collection("sessions");
  var userCollection = client.db("userList").collection("info");
  authCollection.findOne({_id: req.session.id}, function(err, result){
     if(err)
       throw err;
     else{
       if(result != undefined){
         let userName = result.session;
         userName = userName.split("\"name\":")[1];
         userName = userName.split(",")[0];
         userName = userName.replace(/\"/gi,"");    // 문자열로 된 세션 정보를 여러번 가공해서 name값만을 가져옴
            // 클라이언트에서 받아온 사용자 이름과 세션 스토어 상의 이름이 일치하는지,
            // 현재 발급된 세션 id와 세션 스토어 상의 id가 일치하는지 대조함
         if((userName == req.body.userName) && (result._id == req.session.id)){
           const date = new Date();
           const pathLength = req.body.keyPath.length;

           let queryPath = '_comment';
           for(let i = 0 ; i < pathLength ; i++){
             queryPath += "." + req.body.keyPath.pop() + ".reply";   // 스택의 원리를 이용하여 keypath에 담긴 역순으로 끄집어냄
             if(i == pathLength - 1){
               break;
             }
           }

           var movieCollection = client.db("movieList").collection("info");
           movieCollection.findOne({$and : [{_id : mongoObjectId(req.body.movieId), [queryPath]: {$exists : true}}]}, function(err, result){
             if(err)
               throw err;
             else{
               if(result != null){
                 const data = {};
                 const newCommentId = result._commentCount + 1;
                 const updatePath = queryPath + '.' + newCommentId;
                 let post = {
                   name : req.body.userName,
                   profileImage : req.body.userProfileImage,
                   description : sanitizeHtml(req.body.description),
                   writtenDate : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                   updatedDate : null,
                   deletedDate : null,
                   voteCount: 0,
                   path: updatePath,
                   fileUrl: req.body.fileUrl,
                   src: req.body.movieId,
                   reply : {}
                 }

                 movieCollection.findOneAndUpdate({$and : [{_id : mongoObjectId(req.body.movieId), [queryPath]: {$exists : true}}]}, {$set: {[updatePath]: post, _commentCount: newCommentId}}, {returnOriginal : false}, function(err, result){
                   if(err)
                     throw err;
                   else{
                     if(result != null){
                       data.movieInfo = result.value;
                       userCollection.findOne({email: req.body.userEmail}, function(err, result){
                         if(err){
                           throw err;
                         } else{
                           let history = result.myCommentHistory;
                           if(result.myCommentHistory.length == 0)   // 해당 영화에 댓글을 단적이 없다면 댓글 정보를 담을 배열을 생성
                             history = [];

                           post.title = req.body.movieName;
                           delete post.profileImage;
                           delete post.voteCount;
                           delete post.reply;
                           history.push(post);

                           if(history.length > size)
                             history.shift();

                           userCollection.findOneAndUpdate({email: req.body.userEmail}, {$set: {myCommentHistory : history}}, {returnOriginal : false}, function(err, result){
                             if(err)
                               throw err;
                             else{
                               if(result.value){
                                 req.session.myCommentHistory = result.value.myCommentHistory;
                                 const userInfo = {};
                                 userInfo.name = result.value.name;
                                 userInfo.email = result.value.email;
                                 userInfo.profileImage = result.value.profileImage;
                                 userInfo.myScrap = result.value.myScrap;
                                 userInfo.myMovieVote = result.value.myMovieVote;
                                 userInfo.myCommentVote = result.value.myCommentVote;
                                 userInfo.myCommentHistory = result.value.myCommentHistory;
                                 userInfo.myWatchHistory = result.value.myWatchHistory;
                                 data.userInfo = userInfo;
                                 res.send(data);
                               }
                             }
                           });
                         }
                       });
                     } else{
                       console.log("일치되는 유저 정보 없음");
                       res.send(false);
                     }
                   }
                 });
               } else {
                 console.log("일치되는 댓글 정보 없음");
                 res.send(false);
               }
             }
           });
         } else{
           console.log("세션은 일치하나 로그인 정보가 다름");
           res.send(false);
         }
       } else {
         console.log("현재 사용자와 일치하는 세션 정보 없음");
         res.send(false);
       }
     }
   });
});

app.post('/api/watch/updateComment', function(req, res){
  var authCollection = client.db("auth").collection("sessions");
  var userCollection = client.db("userList").collection("info");
  authCollection.findOne({_id: req.session.id}, function(err, result){
    if(err)
      throw err;
    else{
      if(result != undefined){
        let userName = result.session;
        userName = userName.split("\"name\":")[1];
        userName = userName.split(",")[0];
        userName = userName.replace(/\"/gi,"");    // 문자열로 된 세션 정보를 여러번 가공해서
        // 클라이언트에서 받아온 사용자 이름과 세션 스토어 상의 이름이 일치하는지,
        // 현재 발급된 세션 id와 세션 스토어 상의 id가 일치하는지,
        // 작성자와 현재 로그인한 유저 정보가 일치하는지 확인
        if((userName == req.body.userName) && (result._id == req.session.id) && (req.body.writer == req.body.userName)){
          const date = new Date();
          const pathLength = req.body.keyPath.length - 1;

          let queryPath = '_comment';
          for(let i = 0 ; i < pathLength ; i++){
            queryPath += "." + req.body.keyPath.pop() + ".reply";   // 스택의 원리를 이용하여 keypath에 담긴 역순으로 끄집어냄
            if(i == pathLength - 1){
              break;
            }
          }

          const updatePath = queryPath + '.' + req.body.commentId;
          let post = {
            description : sanitizeHtml(req.body.description),
            updatedDate : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
          }

          collection.findOneAndUpdate({$and : [{_id : mongoObjectId(req.body.movieId), [queryPath]: {$exists : true}}]},
          {$set: {[updatePath + '.description'] : post.description, [updatePath + '.updatedDate'] : post.updatedDate}}, {returnOriginal : false}, function(err, documents){
            if(err)
              throw err;
            else{
              if(documents.value != null){
                const data = {};
                data.movieInfo = documents.value;
                userCollection.findOne({email: req.body.userEmail}, function(err, result){
                  if(err){
                    throw err;
                  } else{
                    if(result != null){
                      const history = result.myCommentHistory;
                      for(let i = 0 ; i < history.length ; i++){
                        if(history[i].path == updatePath){
                          history[i].description = post.description;
                          history[i].updatedDate = post.updatedDate;
                        }
                      }

                      userCollection.findOneAndUpdate({email: req.body.userEmail}, {$set: {myCommentHistory : history}}, {returnOriginal : false}, function(err, result){
                        if(err)
                          throw err;
                        else{
                          if(result.value){
                            req.session.myCommentHistory = result.value.myCommentHistory;
                            const userInfo = {};
                            userInfo.name = result.value.name;
                            userInfo.email = result.value.email;
                            userInfo.profileImage = result.value.profileImage;
                            userInfo.myScrap = result.value.myScrap;
                            userInfo.myMovieVote = result.value.myMovieVote;
                            userInfo.myCommentVote = result.value.myCommentVote;
                            userInfo.myCommentHistory = result.value.myCommentHistory;
                            userInfo.myWatchHistory = result.value.myWatchHistory;
                            data.userInfo = userInfo;
                            res.send(data);
                          }
                        }
                      });
                    } else{
                      console.log("일치되는 유저 정보 없음")
                      res.send(false);
                    }
                  }
                });
              } else {
                console.log("일치되는 댓글 정보 없음")
                res.send(false);
              }
            }
          });
        } else{
          console.log("세션은 일치하나 로그인 정보가 다름");
          res.send(false);
        }
      } else {
        console.log("현재 사용자와 일치하는 세션 정보 없음");
        res.send(false);
      }
    }
  });
});

app.post('/api/watch/deleteComment', function(req, res){        // 커맨드 삭제 처리
  var authCollection = client.db("auth").collection("sessions");
  var userCollection = client.db("userList").collection("info");
  authCollection.findOne({_id: req.session.id}, function(err, result){
    if(err)
      throw err;
    else{
      if(result != undefined){
        let userName = result.session;
        userName = userName.split("\"name\":")[1];
        userName = userName.split(",")[0];
        userName = userName.replace(/\"/gi,"");    // 문자열로 된 세션 정보를 여러번 가공해서 name값만을 가져옴

        if((userName == req.body.userName) && (result._id == req.session.id) && (req.body.writer == req.body.userName)){
          const date = new Date();
          const pathLength = req.body.keyPath.length - 1;

          let queryPath = '_comment';
          for(let i = 0 ; i < pathLength ; i++){
            queryPath += "." + req.body.keyPath.pop() + ".reply";   // 스택의 원리를 이용하여 keypath에 담긴 역순으로 끄집어냄
            if(i == pathLength - 1){
              break;
            }
          }

          const deletedDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
          const updatePath = queryPath + '.' + req.body.commentId;
          collection.findOneAndUpdate({$and : [{_id : mongoObjectId(req.body.movieId), [queryPath]: {$exists : true}}]}, {$set: {[updatePath + '.deletedDate']: deletedDate}}, {returnOriginal : false}, function(err, documents){
            if(err)
              throw err;
            else{
              if(documents.value != null){
                const data = {};
                data.movieInfo = documents.value;
                userCollection.findOne({email: req.body.userEmail}, function(err, result){
                  if(err){
                    throw err;
                  } else{
                    if(result != null){
                      const history = result.myCommentHistory;
                      for(let i = 0 ; i < history.length ; i++){
                        if(history[i].path == updatePath){
                          history[i].deletedDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                        }
                      }

                      userCollection.findOneAndUpdate({email: req.body.userEmail}, {$set: {myCommentHistory : history}}, {returnOriginal : false}, function(err, result){
                        if(err)
                          throw err;
                        else{
                          if(result.value){
                            req.session.myCommentHistory = result.value.myCommentHistory;
                            const userInfo = {};
                            userInfo.name = result.value.name;
                            userInfo.email = result.value.email;
                            userInfo.profileImage = result.value.profileImage;
                            userInfo.myScrap = result.value.myScrap;
                            userInfo.myMovieVote = result.value.myMovieVote;
                            userInfo.myCommentVote = result.value.myCommentVote;
                            userInfo.myCommentHistory = result.value.myCommentHistory;
                            userInfo.myWatchHistory = result.value.myWatchHistory;
                            data.userInfo = userInfo;
                            res.send(data);
                          }
                        }
                      });
                    } else{
                      console.log("일치되는 유저 정보 없음")
                      res.send(false);
                    }
                  }
                });
              } else {
                res.send(false);
              }
            }
          });
        } else{
          console.log("세션은 일치하나 로그인 정보가 다름");
          res.send(false);
        }
      } else {
        console.log("현재 사용자와 일치하는 세션 정보 없음");
        res.send(false);
      }
    }
    });
});

app.post('/api/manageScrap', function(req, res){
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

app.post('/api/manageMovieVote', function(req, res){
  const userCollection = client.db("userList").collection("info");
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
              const userInfo = {};
              userInfo.name = result.value.name;
              userInfo.email = result.value.email;
              userInfo.profileImage = result.value.profileImage;
              userInfo.myScrap = result.value.myScrap;
              userInfo.myMovieVote = result.value.myMovieVote;
              userInfo.myCommentVote = result.value.myCommentVote;
              data.userInfo = userInfo;
              // 영화 db에서 vote 수 갱신
            collection.findOneAndUpdate({_id: mongoObjectId(req.body.movieId)}, {$inc: {_voteCount: count}}, {returnOriginal : false}, function(err, result){
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

app.post('/api/watch/manageCommentVote', function(req, res){
  const userCollection = client.db("userList").collection("info");
  userCollection.findOne({email: req.body.userEmail}, function(err, result){
    if(err)
      throw err;
    else{
      if(result) {
        // 영화 db에서 해당 comment의 vote 수 갱신
        const pathLength = req.body.keyPath.length - 1;
        let queryPath = '_comment';
        for(let i = 0 ; i < pathLength ; i++){
          queryPath += "." + req.body.keyPath.pop() + ".reply";   // 스택의 원리를 이용하여 keypath에 담긴 역순으로 끄집어냄
          if(i == pathLength - 1){
            break;
          }
        }
        const updatePath = queryPath + '.' + req.body.commentId;

        const data = {};
        let isOverlap = false;
        let i;
        const vote = result.myCommentVote; // 중복되면 유저 정보에서 해당 스크랩 정보를 지우고 덮어쓴다.
        if(vote[req.body.movieId] != undefined){
          for(i = 0 ; i < Object.values(vote[req.body.movieId]).length ; i++){
            if(vote[req.body.movieId][i] == updatePath){
              isOverlap = true;
              break;
            }
          }
        }

        let count;
        if(isOverlap){  // 해당 스크랩이 현재 중복되는지 검사
          vote[req.body.movieId].splice(i, 1);  // 해당 중복된 요소 제거
          if(Object.values(vote[req.body.movieId]).length == 0)
            delete vote[req.body.movieId];
          count = - 1;
        }
        else{
          if(vote[req.body.movieId] == undefined)   // 해당 영화에 댓글을 단적이 없다면 댓글 정보를 담을 배열을 생성
            vote[req.body.movieId] = [];
          vote[req.body.movieId].push(updatePath);
          count = 1;
        }

        userCollection.findOneAndUpdate({email: req.body.userEmail}, {$set: {myCommentVote: vote}}, {returnOriginal : false}, function(err, result){
          if(err)
            throw err;
          else{
            if(result.value){
              req.session.myCommentVote = result.value.myCommentVote;
              const userInfo = {};
              userInfo.name = result.value.name;
              userInfo.email = result.value.email;
              userInfo.profileImage = result.value.profileImage;
              userInfo.myScrap = result.value.myScrap;
              userInfo.myMovieVote = result.value.myMovieVote;
              userInfo.myCommentVote = result.value.myCommentVote;
              data.userInfo = userInfo;

              collection.findOneAndUpdate({$and : [{_id : mongoObjectId(req.body.movieId), [queryPath]: {$exists : true}}]},
              {$inc: {[updatePath + '.voteCount'] : count}}, {returnOriginal : false}, function(err, documents){
                if(err)
                  throw err;
                else{
                  if(documents.value != null){
                    data.movieInfo = documents.value;
                    res.send(data);
                  } else {
                    console.log("일치되는 댓글 정보 없음")
                    res.send(false);
                  }
                }
              });
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


app.post('/api/setWatchHistory', function(req, res){
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

app.listen(portNum, function() {
  const date = new Date();
  console.log("Run Express on port " + portNum + "![" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]");
});

function checkComment(comment){
  let res = {};
  for(let i = 0 ; i < Object.values(comment).length ; i++){
    let reply = {};
    const str = Object.keys(comment)[i];
    reply[str] = checkComment(Object.values(comment)[i].reply);
    if(!Object.values(comment)[i].isDeleted){
      Object.values(comment)[i].reply = reply[str];
      res[str] = Object.values(comment)[i];
    } else{
      Object.values(comment)[i].name = '',
      Object.values(comment)[i].description = '',
      Object.values(comment)[i].date = '',
      Object.values(comment)[i].isDeleted = true,
      Object.values(comment)[i].reply = reply[str];
      res[str] = Object.values(comment)[i];
    }
  }
  return res;
}

function setCategoryHot(){
  const numOfHot = 5;   // 인기 영화로 선정할 갯수
  collection.find().toArray(function(err, result) {
    if(err)
      throw err;
    else{
      for(let i = 0 ; i < result.length ; i++){       // 영화 목록에서 hot 태그 모두 제거
        for(let j = 0 ; j < result[i]._tag.length ; j++){
          if(result[i]._tag[j] == 'hot'){
            result[i]._tag.splice(j, 1);
            break;
          }
        }
      }

      result = result.sort(
                 function(a, b){           // 영화 목록을 좋아요 수가 많은 순으로 정렬(내림차순)
                   return b['_voteCount'] - a['_voteCount'];
               });

      for(let i = 0 ; i < numOfHot ; i++){    // 위에서 지정한 개수만큼 hot 태그 부여
        for(let j = 0 ; j < result[i]._tag.length ; j++){
          if(result[i]._tag[j] == 'hot')
            break;
        }
        result[i]._tag.push('hot');
      }
    }

    collection.bulkWrite(     // 한 쿼리로 여러 문서를 한번에 업데이트한다.
      result.map((data) =>      // map은 리스트의 요소를 지정된 함수로 처리해주는 함수이다.
        ({
          updateOne: {
            filter: { _id: data._id },
            update: { $set: {_tag: data._tag} }   // 태그 정보만 업데이트
          }
        })
      )
    );
  });
};

function setCategoryNew(){
  const dateOfNew = 14;   // 인기 영화로 선정할 일수 (예 : 3으로 설정하면 현재 날짜에서 3일 이내에 올라온 영화 정보는 모두 인기 목록에 담김)
  collection.find().toArray(function(err, result) {
    if(err)
      throw err;
    else{
      for(let i = 0 ; i < result.length ; i++){       // 영화 목록에서 new 태그 모두 제거
        for(let j = 0 ; j < result[i]._tag.length ; j++){
          if(result[i]._tag[j] == 'new'){
            result[i]._tag.splice(j, 1);
            break;
          }
        }
        const date = new Date();
        date.setDate(date.getDate() - dateOfNew);   // 지정한 일수 이내에 업로드된 영화라면 new 태그를 달아준다.
        if(result[i]._uploadTime > date) {
          result[i]._tag.push('new');
        }
      }

      collection.bulkWrite(
        result.map((data) =>
          ({
            updateOne: {
              filter: { _id: data._id },
              update: { $set: {_tag: data._tag} }   // 태그 정보만 업데이트
            }
          })
        )
      );
    }
  });
};
