const express = require('express');
const router = express.Router();
const mongoClient = require('mongodb').MongoClient;
const mongoObjectId = require('mongodb').ObjectId;
const mongoDBUrl = require('../DB/mongoDBInfo.js').getURL();
const client = new mongoClient(mongoDBUrl, { useNewUrlParser: true });
const sanitizeHtml = require('sanitize-html');

client.connect(err => {
});

router.post('/writeComment', function(req, res){
  const size = 10;
  const movieCollection = client.db("movieList").collection("info");
  const authCollection = client.db("auth").collection("sessions");
  const userCollection = client.db("userList").collection("info");
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

router.post('/updateComment', function(req, res){
  const movieCollection = client.db("movieList").collection("info");
  const authCollection = client.db("auth").collection("sessions");
  const userCollection = client.db("userList").collection("info");
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

          movieCollection.findOneAndUpdate({$and : [{_id : mongoObjectId(req.body.movieId), [queryPath]: {$exists : true}}]},
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

router.post('/deleteComment', function(req, res){        // 커맨드 삭제 처리
  const movieCollection = client.db("movieList").collection("info");
  const authCollection = client.db("auth").collection("sessions");
  const userCollection = client.db("userList").collection("info");
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
          movieCollection.findOneAndUpdate({$and : [{_id : mongoObjectId(req.body.movieId), [queryPath]: {$exists : true}}]}, {$set: {[updatePath + '.deletedDate']: deletedDate}}, {returnOriginal : false}, function(err, documents){
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

router.post('/manageCommentVote', function(req, res){
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

              movieCollection.findOneAndUpdate({$and : [{_id : mongoObjectId(req.body.movieId), [queryPath]: {$exists : true}}]},
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

module.exports = router;
