import React, { Component } from 'react';
import Redux from './redux';
import css from '../css/watch.css';
import videojs from 'video.js';
import VideoPlayer from './videoPlayer';
import Comment from './comment';
import favoriteIcon1 from '../Image/icon/favorite1.png';
import favoriteIcon2 from '../Image/icon/favorite2.png';
import voteIcon1 from '../Image/icon/vote1.png';
import voteIcon2 from '../Image/icon/vote2.png';


class WatchApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curMovieInfo: null,
      id: null,
      isVoted: false,
      isCommentFold: true,
    }

    this.updateViewingCount = this.updateViewingCount.bind(this);
    this.renderWatchComponent = this.renderWatchComponent.bind(this);
    this.scrapMovie = this.scrapMovie.bind(this);
    this.checkScrap = this.checkScrap.bind(this);
    this.checkMovieVote = this.checkMovieVote.bind(this);
    this.voteMovie = this.voteMovie.bind(this);
    this.playMovie = this.playMovie.bind(this);
    this.foldComment = this.foldComment.bind(this);
    this.PiPtoNormal = this.PiPtoNormal.bind(this);
    this.NormalToPiP = this.NormalToPiP.bind(this);
    this.setCommentInfo = this.setCommentInfo.bind(this);
    this.goToTop = this.goToTop.bind(this);
    /*
    생성자에서 state를 대입할때는 setState() 함수보다 직접 대입하는 것이 좋다.
    왜냐하면 생성자에선 mount 되지 않았으므로 setState() 함수가 버그를 유발할 수 있기 때문이다.
    */
    let curId = window.location.href.split("=");
    this.state.id = curId[1];
  }

  componentDidMount() {
    Redux.dispatch({type:'setCurPage', pageName: 'watch'});
    const { showUpperIcon } = this.props;
    showUpperIcon();
    this.updateViewingCount();
  }

  componentWillUnmount(){
    document.querySelector("footer").style.display = "block";
  }

  render() {
    let curMovie;
    curMovie = this.renderWatchComponent();
    return (
      <div id="contentWrapper">
        <div id="watchTeaser">
          <img className="movieTeaserImage" src={this.state.curMovieInfo ? this.state.curMovieInfo._fileUrl + this.state.curMovieInfo._teaser.image : null}></img>
          <div className="movieTeaserBackground"></div>
          <div className="movieTeaserInfo">
            <img className="teaserLogo" src={this.state.curMovieInfo != undefined ? this.state.curMovieInfo._fileUrl + this.state.curMovieInfo._teaser.logo : null}></img>
            <p className="teaserDescription">{this.state.curMovieInfo != undefined ? this.state.curMovieInfo._teaser.description : null}</p>
            <div className="showTeaserMovie watchTeaserPlayButton" onClick={()=>this.playMovie(true)}>
              <span>
                <div></div>
                <p>재생</p>
              </span>
            </div>
          </div>
        </div>
        <div id="watchWrapper">
          {curMovie}
        </div>
      </div>
    );
  }

  updateViewingCount(){       // 시청 시 조회수 갱신
    fetch('/api/movie/updateViewingCount=' + this.state.id,{
      headers : {
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      credentials: 'include'
    }).then(res=>res.json())
    .then(data=>{
      this.setState({curMovieInfo: data.result});
    });
  }

  renderWatchComponent(){       // watch 컴포넌트 그리는 함수
    if(this.state.curMovieInfo != null){
      const movieInfo = this.state.curMovieInfo;
      const { userInfo } = this.props;
      const date = new Date(movieInfo._uploadTime);
      let scrapButton = this.checkScrap(userInfo);
      let voteButton = this.checkMovieVote(userInfo);
      let movieTag = '', movieSubtitle = '', movieQuality = '', movieActor = '';

      for(let i = 0 ; i < movieInfo._tag.length ; i++){   // 장르 출력
        if(movieInfo._tag[i] == 'hot' || movieInfo._tag[i] == 'new'){     // hot과 new는 출력 생략
          continue;
        }
        movieTag += movieInfo._tag[i];
        if(i != movieInfo._tag.length - 1)
          movieTag += ", ";
      }

      if(movieTag.substr(movieTag.length - 2) == ", ")    // 맨 마지막 두 글자 검사
        movieTag =  movieTag.slice(0, -2);        // 맨 마지막이 ", "로 끝이나면 ", "를 제거(공백과 콤마 둘다)

      for(let i = 0 ; i < Object.values(movieInfo._info._sub).length ; i++){    // 자막 출력
        movieSubtitle += Object.values(movieInfo._info._sub)[i]._label;
        if(i != Object.values(movieInfo._info._sub).length - 1)
          movieSubtitle += ", ";
      }

      for(let i = 0 ; i < Object.values(movieInfo._info._quality).length ; i++){    // 해상도 출력
        movieQuality += Object.keys(movieInfo._info._quality)[i];
        if(i != Object.values(movieInfo._info._quality).length - 1)
          movieQuality += ", ";
      }

      for(let i = 0 ; i < Object.values(movieInfo._info._actor).length ; i++){    // 해상도 출력
        movieActor += Object.values(movieInfo._info._actor).[i];
        if(i != Object.values(movieInfo._info._actor).length - 1)
          movieActor += ", ";
      }

      return (
        <div>
          <div id="watchMoveInfo">
            <h1>트레일러 상세 정보</h1>{scrapButton}{voteButton}
            <ul>
              <li><p>장르</p><p>{movieTag}</p></li>
              <li><p>자막</p><p>{movieSubtitle}</p></li>
              <li><p>지원 해상도</p><p>{movieQuality}</p></li>
              <li><p>재생시간</p><p>{movieInfo._info._duration}</p></li>
              <li><p>출연 배우</p><p>{movieActor}</p></li>
            </ul>
          </div>
          <div id="videoWrapper">
            <VideoPlayer movieInfo={movieInfo} playMovie={this.playMovie} NormalToPiP={this.NormalToPiP} PiPtoNormal={this.PiPtoNormal}/>
          </div>
          <div id id="commentMenu">
            <h1 onClick={this.foldComment}>댓글 보기({movieInfo._commentCount})</h1>
            <div className="goToTopButton goToTopHide" onClick={this.goToTop}><b>&#8593;Top</b></div>
            <div id="comment">
              <div id="commentTop"></div>
              <Comment movieInfo={movieInfo} foldComment={this.foldComment} setCommentInfo={this.setCommentInfo} />
            </div>
          </div>
        </div>
      );
    }
  }

  scrapMovie(){   // 스크랩 정보를 서버에 전달
    const { userInfo } = this.props;
    const scrap = {};
    scrap.userName = userInfo.name;
    scrap.email = userInfo.email;
    scrap.movieId = this.state.id;
    scrap.fileUrl = this.state.curMovieInfo._fileUrl,
    scrap.thumbnail = this.state.curMovieInfo._thumbnailUrl;

    fetch('/api/user/manageScrap', {
       method :"PATCH",
       headers:{
         'content-type':'application/json'
       },
       body:JSON.stringify(scrap),
       credentials: 'include'
    }).then(res=>res.json())
    .then(data=>{
      if(data){
        const userInfo = Redux.getState().userInfo;
        userInfo.myScrap = data;
        Redux.dispatch({type:'setUserInfo', userInfo: userInfo});
        console.log("스크랩 정보 갱신 성공");
      } else{
        console.log("스크랩 정보 갱신 실패");
      }
    });
  }

  checkScrap(userInfo){   // 스크랩 유무를 체크하여 버튼 내용을 바꿈
    let scrapButton = [];
    if(userInfo != null && userInfo.myScrap != undefined){
      scrapButton = (<div className="scrapButton"><img src={favoriteIcon1} onClick={this.scrapMovie}/><p onClick={this.scrapMovie}>스크랩</p></div>);
      for(let i = 0 ; i < Object.keys(userInfo.myScrap).length ; i++){
        if(Object.keys(userInfo.myScrap)[i] == this.state.id){
          scrapButton = (<div className="scrapButton scrapDone"><img src={favoriteIcon2} onClick={this.scrapMovie}/><p onClick={this.scrapMovie}>스크랩 완료</p></div>);
          break;
        }
      }
    }
    return scrapButton;
  }

  checkMovieVote(userInfo){     // 좋아요 버튼을 눌렀는지 체크
    let voteButton = [];
    const movieInfo = this.state.curMovieInfo;
    if(userInfo != null && userInfo.myMovieVote != undefined){
      const vote = userInfo.myMovieVote;
      for(let i = 0 ; i < Object.keys(vote).length ; i++){
        if(Object.keys(vote)[i] == this.state.id){
          voteButton.push(<div className="voteButton movieVoteDone" key={this.state.id}><img src={voteIcon2} onClick={this.voteMovie}/><p onClick={this.voteMovie}>좋아요 누름({movieInfo._voteCount})</p></div>);
          return voteButton;
        }
      }
      voteButton.push(
        <div className="voteButton" key={this.state.id}><img src={voteIcon1} onClick={this.voteMovie}/><p onClick={this.voteMovie} >좋아요({movieInfo._voteCount})</p></div>
      );
    }
    return voteButton;
  }

  voteMovie(){        // 좋아요 눌렀을 때 갱신 처리
    const { userInfo } = this.props;
    const voteInfo = {};
    voteInfo.movieId = this.state.id;
    voteInfo.fileUrl = this.state.curMovieInfo._fileUrl;
    voteInfo.thumbnail = this.state.curMovieInfo._thumbnailUrl;
    voteInfo.userEmail = userInfo.email;

    fetch('/api/user/manageMovieVote',{
       method :"PATCH",
       headers:{
         'content-type':'application/json'
       },
       body:JSON.stringify(voteInfo),
       credentials: 'include'
    }).then(res=>res.json())
    .then(data=>{
      if(data){
        const userInfo = Redux.getState().userInfo;
        userInfo.myMovieVote = data.movieVote;
        Redux.dispatch({type:'setUserInfo', userInfo: userInfo});
        this.setState({curMovieInfo : data.movieInfo});
        console.log("영화 좋아요 정보 갱신 성공");
      } else{
        console.log("영화 좋아요 정보 갱신 실패");
      }
    });
  }

  playMovie(bool){          // watch 페이지에 진입했을 때 현재 재생되는 영상이 있으면 티저 이미지 비활성화
    if(bool){
      if(screen.width < 480)
        document.getElementById("watchWrapper").style.top = "125px";
      else
        document.getElementById("watchWrapper").style.top = "75px";

      document.getElementById("watchTeaser").style.display = "none";
      document.getElementById("watchMoveInfo").style.display = "none";
      document.getElementById("videoWrapper").style.display = "block";
      document.getElementById("commentMenu").style.display = "inline-block";
      document.querySelector("footer").style.display = "none";
      const watchPlayer = document.getElementById('watchPlayer');
      videojs(watchPlayer).play();
      const set = Redux.getState().videoMenuSet;
      set.isDirect = false;
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
      window.scrollTo(0, 0);    // 화면을 맨 상단으로 이동시킴
    }
  }

  foldComment(){          // 영화 시청시 댓글 여닫기 처리
    const movieInfo = this.state.curMovieInfo;
    const videoWrapper = document.getElementById("videoWrapper");
    let set = Redux.getState().videoMenuSet;
    if(this.state.isCommentFold){
      videoWrapper.style.height = "0";

      if(screen.width < 480)        // 모바일 해상도인지 체크
        videoWrapper.style.top = "-125px";
      else
        videoWrapper.style.top = "-75px";
      document.getElementById("comment").style.display = "block";
      document.getElementsByClassName("goToTopButton")[0].classList.remove("goToTopHide");
      this.setState({isCommentFold: false});
      document.getElementById("commentMenu").querySelector(":scope > h1").innerHTML = "댓글 닫기(" + movieInfo._commentCount + ")";
      if(!set.isPiPMode)
        this.NormalToPiP(set, this.state.curMovieInfo._fileUrl);
    } else {
      if(screen.width < 480)
        videoWrapper.style.height = "calc(85vh - 125px)";
      else
        videoWrapper.style.height = "calc(90vh - 75px)";
      videoWrapper.style.top = "unset";
      document.getElementById("comment").style.display = "none";
      document.getElementsByClassName("goToTopButton")[0].classList.add("goToTopHide");
      this.setState({isCommentFold: true});
      document.getElementById("commentMenu").querySelector(":scope > h1").innerHTML = "댓글 보기(" + movieInfo._commentCount + ")";
      if(set.isPiPMode)
        this.PiPtoNormal(set);
    }
  }

  NormalToPiP(set, url){      // PiP모드로 진입할때 처리 함수
    const normalWindow = document.getElementById("normalWindow");
    const pipWindow = document.getElementById("pipWindow");
    const pipContent = pipWindow.childNodes[0];

    if(screen.width < 480){
      pipWindow.style.width = "640px";    // 위치 초기화
      pipWindow.style.height = "360px";
      pipWindow.style.right = "0px";
      pipWindow.style.bottom = "0px";
    } else{
      pipWindow.style.width = "320px";    // 위치 초기화
      pipWindow.style.height = "180px";
      pipWindow.style.right = "10px";
      pipWindow.style.bottom = "10px";
    }
    pipWindow.style.top = "";
    pipWindow.style.left = "";

    pipWindow.classList.remove("pipHide");
    set.isPiPMode = true;
    set.curVideoURL = url;
    while (normalWindow.childNodes.length > 0) {
      pipContent.appendChild(normalWindow.childNodes[0]);
    }
    normalWindow.innerHTML +=
    `<div id="noticePiP">PIP 모드 중입니다.</div>`;
    Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
  }

  PiPtoNormal(set){         // 일반 모드로 복귀할 때 처리하는 함수
    const normalWindow = document.getElementById("normalWindow");
    const pipWindow = document.getElementById("pipWindow");
    const pipContent = pipWindow.childNodes[0];

    set.isPiPMode = false;
    Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});

    if(Redux.getState().curPage == 'watch'){
      pipWindow.classList.add("pipHide");
      normalWindow.innerHTML = '';
      while (pipContent.childNodes.length > 0) {
        normalWindow.appendChild(pipContent.childNodes[0]);
      }
      if(!this.state.isCommentFold)
        this.foldComment();
    } else{
      pipWindow.classList.add("pipHide");
      const watchPlayer = document.getElementById('watchPlayer');
      videojs(watchPlayer).dispose();
      pipContent.innerHTML = '';
    }
  }

  setCommentInfo(set){        // 댓글 전체 개수 갱신에 사용
    this.setState({curMovieInfo: set, isCommentFold: true});
    this.foldComment();
  }

  goToTop(e){         // Top 버튼을 눌렀을 때 맨 위로 돌아가도록 처리
    if(!e.target.classList.contains("goToTopHide")){
      const top = document.getElementById("commentTop");
      top.scrollIntoView({ behavior: 'smooth', block: 'end'});    // 부드럽게 이동
    }
  }
}

export default WatchApp;
