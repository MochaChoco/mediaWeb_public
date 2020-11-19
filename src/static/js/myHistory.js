import React, { Component } from 'react';
import Redux from './redux';
import { Link } from 'react-router-dom';
import css from '../css/myHistory.css';

class MyHistoryApp extends Component {
  constructor(props) {
    super(props);
    this.openHistoryPopUp = this.openHistoryPopUp.bind(this);
  }

  render() {
    const { userInfo, checkPiP, goToMyComment } = this.props;
    const commentHistory = [], watchHistory = [], commentHistoryContents = [], watchHistoryContents = [];
    if(userInfo != null && userInfo.myCommentHistory != undefined){
      for(let i = 0 ; i < userInfo.myCommentHistory.length ; i++){
        commentHistory.push(
          <Link to={`${'/watch=' + userInfo.myCommentHistory[i].src}`} key={userInfo.myCommentHistory[i].title + userInfo.myCommentHistory[i].description + userInfo.myCommentHistory[i].writtenDate} onClick={()=>{
            checkPiP(userInfo.myCommentHistory[i].fileUrl);
            const set = Redux.getState().videoMenuSet;
            set.myCommentId = userInfo.myCommentHistory[i].path.split(".")[userInfo.myCommentHistory[i].path.split(".").length - 1];
            set.isDirect = true;
          }}>
            <ul>
              <li className="commentMovieName"><p>{userInfo.myCommentHistory[i].title}</p></li>
              <li className="commentDesc"><p>{userInfo.myCommentHistory[i].description}</p></li>
              <li className="commentWrittenDate"><p>{userInfo.myCommentHistory[i].writtenDate}</p></li>
            </ul>
          </Link>
        );
      }
      if(userInfo.myCommentHistory.length == 0){
        commentHistory.push(<h1 key='notCommentYet'>아직 작성한 댓글이 없습니다.</h1>);
      }

      commentHistoryContents.push(
        <div id="historyContents" key="historyContents_Comment">
          <ul id="commentHistoryIndex">
            <li className="commentMovieName"><p>영화 제목</p></li>
            <li className="commentDesc"><p>댓글 내용</p></li>
            <li className="commentWrittenDate"><p>작성 날짜</p></li>
          </ul>
          <div id="historyList">
            {commentHistory}
          </div>
        </div>
      );
    }

    if(userInfo != null && userInfo.myWatchHistory != undefined){
      for(let i = 0 ; i < userInfo.myWatchHistory.length ; i++){
        watchHistory.push(
          <Link to={`${'/watch=' + userInfo.myWatchHistory[i].id}`} key={userInfo.myWatchHistory[i].movieTitle + userInfo.myWatchHistory[i].readingTime} onClick={()=>checkPiP(userInfo.myWatchHistory[i].fileUrl)}>
            <ul>
              <li className="commentMovieName watchedComment"><p>{userInfo.myWatchHistory[i].movieTitle}</p></li>
              <li className="commentVisitedDate"><p>{userInfo.myWatchHistory[i].readingTime}</p></li>
            </ul>
          </Link>
        );
      }
      if(userInfo.myWatchHistory.length == 0){
        watchHistory.push(<h1 key='notCommentYet'>아직 작성한 댓글이 없습니다.</h1>);
      }

      watchHistoryContents.push(
        <div id="historyContents" key="historyContents_Watch">
          <ul id="commentHistoryIndex">
            <li className="commentMovieName watchedComment"><p>영화 제목</p></li>
            <li className="commentVisitedDate"><p>방문 시간</p></li>
          </ul>
          <div id="historyList">
            {watchHistory}
          </div>
        </div>
      );
    }

    const { isMobile } = this.props;
    let alertStr;

    if(isMobile && window.innerWidth < 1024)
      alertStr = (<p>※ 최근 댓글 기록과 트레일러는<br></br>&nbsp;&nbsp;&nbsp;각각 10개까지 저장되며, 목록을 누르면<br></br>&nbsp;&nbsp;&nbsp;해당 위치로 이동합니다.</p>);
    else
      alertStr = (<p>※ 최근 댓글 기록과 트레일러는 각각 10개까지 저장되며,<br></br>&nbsp;&nbsp;&nbsp;목록을 누르면 해당 위치로 이동합니다.</p>);

    return (
      <div id="historyWrapper">
        <div id="commentHistory">
          <h1 onClick={()=>this.openHistoryPopUp(commentHistoryContents, 'comment')}>최근 댓글 기록</h1>
        </div>
        <div id="watchHistory">
          <h1 onClick={()=>this.openHistoryPopUp(watchHistoryContents, 'watch')}>최근 시청한 트레일러</h1>
        </div>
        {alertStr}
      </div>
    );
  }

  openHistoryPopUp(history, type){          // historyPoPup 창 여는 함수
    document.getElementsByTagName('body')[0].classList.add('preventScroll');
    const popUpBackground = document.getElementById("popupBackground");
    const popUpWindow = document.getElementById("historyPoPup");
    const { setHistory } = this.props;

    popUpBackground.style.display = "block";
    popUpWindow.style.display = "block";
    setHistory(history, type);      // myInfo 컴포넌트에서 띄워줄 history 정보 설정
  }
}

export default MyHistoryApp;
