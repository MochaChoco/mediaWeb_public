const express = require('express');
const router = express.Router();
const mongoClient = require('mongodb').MongoClient;
const mongoDBUrl = require('../DB/mongoDBInfo.js').getURL();
const mongoObjectId = require('mongodb').ObjectId;
const client = new mongoClient(mongoDBUrl, { useNewUrlParser: true });

client.connect(err => {
});


  // 영화 전체 정보를 불러옴
router.get('/getMovieInfo', (req, res) => {
  const collection = client.db("movieList").collection("info");
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

  // 현재 페이지에 맞는 영화 정보를 불러옴
router.post('/getWatchMovieOne', function(req, res){
  const collection = client.db("movieList").collection("info");
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
router.post('/updateViewingCount', function(req, res){
  const collection = client.db("movieList").collection("info");
  collection.findOneAndUpdate({_id : mongoObjectId(req.body.id)}, {$inc: {_viewingCount: 1}}, {returnOriginal : false}, function(err, documents){
    if(err)
      throw err;
    else{
      res.send({result : documents.value});
    }
  });
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

module.exports = router;
