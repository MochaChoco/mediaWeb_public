import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Redux from './redux';
import css from '../css/myScrap.css';

class myScrapApp extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    Redux.dispatch({type:'setCurPage', pageName: 'myScrap'});
    const { showUpperIcon } = this.props;
    showUpperIcon();
  }

  render() {
    window.scrollTo(0,0);   // 화면 전환시 맨 위로 이동하도록 설정
    const { userInfo, checkPiP } = this.props;
    let scrapList = [];

    if(userInfo != null && userInfo.myScrap != undefined){
      for(let i = 0 ; i < Object.keys(userInfo.myScrap).length ; i++){
        const scrapInfo = Object.values(userInfo.myScrap)[i];
        scrapList.push(
          <div className="movieWrapper myScrapMovies" key={i}>
              <Link to= {`${'/watch=' + Object.keys(userInfo.myScrap)[i]}`} className="movieLink" onClick={()=>checkPiP(scrapInfo.fileUrl)}>
                <img src={scrapInfo.fileUrl + scrapInfo.thumbnail} className="movieClip" draggable="false"></img>
              </Link>
          </div>);
      }
    }

    return (
      <div id="contentWrapper">
        <div id="myScrapWrapper">
          <h1>내가 찜한 콘텐츠들</h1>
          <div id="scrapWrapper">
            {scrapList.length != 0 ? scrapList : <h2 id="noScrapWarning">현재 찜한 콘텐츠가 없습니다.</h2>}
          </div>
        </div>
      </div>
    );
  }
}

export default myScrapApp;
