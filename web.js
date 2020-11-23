const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const portNum = 8081;
const mongoClient = require('mongodb').MongoClient;
const mongoDBUrl = require('./DB/mongoDBInfo.js').getURL();
const client = new mongoClient(mongoDBUrl, { useNewUrlParser: true });
const sessionInfo = require('./auth/sessionInfo.js').getSessionInfo(client);
const fallback = require('express-history-api-fallback');
const root = __dirname + "/dist";
const authRouter = require('./routes/auth.js');
const movieRouter = require('./routes/movie.js');
const userRouter = require('./routes/user.js');
const watchRouter = require('./routes/watch.js');

app.use(express.static(root));
app.use(fallback('index.html', { root }));
app.use(bodyParser.json());
app.use(session(sessionInfo));
app.use('/api/auth', authRouter);
app.use('/api/movie', movieRouter);
app.use('/api/user', userRouter);
app.use('/api/watch', watchRouter);

client.connect(err => {
  setTimeout(setCategoryHot, 1000);   // mongoDB 관련 변수가 초기화되고 나서 불러주도록 설정
  setTimeout(setCategoryNew, 5000);
  setInterval(setCategoryHot, 3600000);   // 1시간마다 좋아요 수에 따른 인기 영화 목록 갱신
  setInterval(setCategoryNew, 86400000);   // 24시간마다 최신 영화 목록 갱신
});

app.listen(portNum, function() {
  const date = new Date();
  console.log("Run Express on port " + portNum + "![" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]");
});

    // vote 수가 가장 많은 영화 5개를 인기 영화로 선정
function setCategoryHot(){
  const collection = client.db("movieList").collection("info");
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

    // 업로드 된지 14일 이내의 영화를 신규 영화로 선정
function setCategoryNew(){
  const collection = client.db("movieList").collection("info");
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
