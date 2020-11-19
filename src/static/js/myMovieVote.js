import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Redux from './redux';
import css from '../css/myMovieVote.css';

class myMovieVoteApp extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    Redux.dispatch({type:'setCurPage', pageName: 'myMovieVote'});
    const { showUpperIcon } = this.props;
    showUpperIcon();
  }

  render() {
    window.scrollTo(0,0);   // 화면 전환시 맨 위로 이동하도록 설정
    const { userInfo, checkPiP } = this.props;
    let scrapList = [];

    if(userInfo != null && userInfo.myMovieVote != undefined){
      for(let i = 0 ; i < Object.keys(userInfo.myMovieVote).length ; i++){
        const scrapInfo = Object.values(userInfo.myMovieVote)[i];
        scrapList.push(
          <div className="movieWrapper myMovieVote" key={i}>
              <Link to= {`${'/watch=' + Object.keys(userInfo.myMovieVote)[i]}`} className="movieLink" onClick={()=>checkPiP(scrapInfo.fileUrl)}>
                <img src={scrapInfo.fileUrl + scrapInfo.thumbnail} className="movieClip" draggable="false"></img>
              </Link>
          </div>);
      }
    }

    return (
      <div id="contentWrapper">
        <div id="myMovieVoteWrapper">
          <h1>좋아요 한 콘텐츠들</h1>
          <div id="voteWrapper">
            {scrapList.length != 0 ? scrapList : <h2 id="noMovieVoteWarning">현재 좋아요를 누른 콘텐츠가 없습니다.</h2>}
          </div>
        </div>
      </div>
    );
  }
}

export default myMovieVoteApp;
