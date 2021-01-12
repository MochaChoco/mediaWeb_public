import React, { Component } from 'react';
import Redux from './redux';
import { Link } from 'react-router-dom';
import videojs from 'video.js';
import videoCss from '../css/video-js.css';
import customCss from '../css/video-js-custom.css';
import pip from './pipWindow.js';

class VideoPlayerApp extends Component {
  constructor(props) {
    super(props);
    this.setVideoPlayer = this.setVideoPlayer.bind(this);
    this.setTrackList = this.setTrackList.bind(this);
    this.setQuality = this.setQuality.bind(this);
    this.setSubtitle = this.setSubtitle.bind(this);
    this.setPiP = this.setPiP.bind(this);
    this.foldMenu = this.foldMenu.bind(this);
    this.closeMovie = this.closeMovie.bind(this);
    this.setWatchHistory = this.setWatchHistory.bind(this);
    this.checkiOS = this.checkiOS.bind(this);
  }

  componentDidMount(){
    const { movieInfo, playMovie, PiPtoNormal } = this.props;
    if(!Redux.getState().videoMenuSet.isPiPMode){   // pip모드가 아닐때
      document.getElementById("videoWrapper").style.display = "none";
      const myPlayer = this.setVideoPlayer();
      playMovie(Redux.getState().videoMenuSet.isDirect);
    } else {      // pip모드일때
      const normalWindow = document.getElementById('normalWindow');
      normalWindow.innerHTML = '';
      let set = Redux.getState().videoMenuSet;
      PiPtoNormal(set);
      const button = document.getElementsByClassName("vjs-play-pip")[0];
      button.className = "vjs-play-pip vjs-play-pip-off";
      playMovie(true);      // pip 모드를 한 상태면 티저를 직접 누른 것과 관계없이 바로 watch페이지에서 티저 이미지 숨김처리
    }
  }

  componentWillUnmount(){
    if(!Redux.getState().videoMenuSet.isPiPMode){
      const watchPlayer = document.getElementById('watchPlayer');
      videojs(watchPlayer).dispose();
    }
    else {
      const button = document.getElementsByClassName("vjs-play-pip")[0];
      button.className = "vjs-play-pip vjs-play-pip-close";
    }
  }

  render() {
    const { movieInfo } = this.props;
    let defaultQuality = Object.values(movieInfo._info._quality)[Object.values(movieInfo._info._quality).length - 1];  // 제일 높은 해상도에서 한단계 낮은 것이 default 퀄리티
    let trackList = [];
    this.setTrackList(movieInfo, trackList);
    return (
        <div id="normalWindow">
          <video id="watchPlayer" disablePictureInPicture>
            <source src={movieInfo ? `${movieInfo._fileUrl + defaultQuality}` : 'movie not found'} type="application/x-mpegURL" />
            {trackList}
          </video>
        </div>
    );
  }

  setVideoPlayer(){       // 비디오 플레이어 설정(옵션, 재생 설정, 버튼 매핑 등등)
    const { movieInfo, PiPtoNormal } = this.props;
    const url = movieInfo._fileUrl;
    window.VIDEOJS_NO_DYNAMIC_STYLE = true;   // videojs에서 제공하는 스타일 무시
    const watchPlayer = document.getElementById("watchPlayer");
    let options = {
      controls: true,
      autoplay: false,
      'html5': {
        nativeTextTracks: false   // 브라우저 기본 자막 사용하지 않고 video js 자막 강제 출력
      }
    };
    const thisFunc = this;
    var player = videojs('watchPlayer', options, function onPlayerReady() {
      this.one('play', function(){    // 최초 실행시
        thisFunc.setWatchHistory();
      });
      this.on('timeupdate', function(){
        const playInfo = Redux.getState().videoMenuSet;
        if(playInfo.curTime != undefined && playInfo.isChanged != undefined && playInfo.isChanged == false){
          let set = Redux.getState().videoMenuSet;
          set.isChanged = true;
          this.currentTime(set.curTime);
          Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
          this.play();
        }
      });
      this.on('pause', function(){
      });
      this.on('ended', function(){
        let set = Redux.getState().videoMenuSet;
        if(set.isPiPMode)
          PiPtoNormal(set);
        if(Redux.getState().curPage == 'watch')
          thisFunc.closeMovie();
      });
    });

    player.addClass("video-js");
    this.setQuality(player, movieInfo);
    this.setSubtitle(player, movieInfo);
    this.setPiP(player, movieInfo);

    return watchPlayer;
  }

  setTrackList(movieInfo, trackList){           // 영화 정보 object의 자막 개수만큼 dom 추가
    const subInfo = movieInfo._info._sub;
    if(movieInfo != null){    // 자막의 개수만큼 track 추가
      for(let i = 0 ; i < Object.keys(subInfo).length ; i++){
        const srcLang = Object.keys(subInfo)[i];
        const label = Object.values(subInfo)[i]._label;
        const fileName = Object.values(subInfo)[i]._fileName;
        trackList.push(
          <track kind="subtitles" src={movieInfo ? `${movieInfo._fileUrl + fileName}` : 'subtitle not found'} srcLang={srcLang} label={label} key={i} default />
        );
      }
    }
  }

  setQuality(player, movieInfo){          // 해상도 조절 메뉴 처리
    var myButton = player.controlBar.addChild("button");
    var myButtonDom = myButton.el();
    myButtonDom.title = "Quality";
    myButtonDom.classList.add("vjs-play-control");
    myButtonDom.childNodes[0].className = "vjs-play-qualities";
    myButtonDom.innerHTML +=
    `<div class="videoQualityMenu"><ul></ul></div>`;

    const videoQualityMenu = document.getElementsByClassName("videoQualityMenu")[0].childNodes[0];  // 자막 메뉴 설정
    for(let i = 0 ; i < Object.keys(movieInfo._info._quality).length ; i++){
      videoQualityMenu.innerHTML += `<li class="videoQualitySet"><p>${Object.keys(movieInfo._info._quality)[i]}</p></li>`;
    }
    const qualityInfo = Object.values(movieInfo._info._quality);
    const qualitySet = document.getElementsByClassName("videoQualitySet");
    let set = Redux.getState().videoMenuSet;
    set.curQuality = qualityInfo[qualityInfo.length - 2].split(".")[0];          // 기본 해상도 설정
    Redux.dispatch({type:'setVideoMenu', videoMenuSet: set});

    for(let i = 0 ; i < qualityInfo.length ; i++){
      qualitySet[i].onclick = function(){
        let set = Redux.getState().videoMenuSet;
        set.curTime = player.currentTime();
        set.curQuality = qualityInfo[i].split(".")[0];
        set.isChanged = false;
        Redux.dispatch({type:'setVideoMenu', videoMenuSet: set});
        player.src({src: movieInfo._fileUrl + qualityInfo[i], type : "application/x-mpegURL"});
      }
      qualitySet[i].ontouchstart = function(){
        let set = Redux.getState().videoMenuSet;
        set.curTime = player.currentTime();
        set.curQuality = qualityInfo[i].split(".")[0];
        set.isChanged = false;
        Redux.dispatch({type:'setVideoMenu', videoMenuSet: set});
        player.src({src: movieInfo._fileUrl + qualityInfo[i], type : "application/x-mpegURL"});
      }
    }
      // 메뉴 높이 설정
    videoQualityMenu.style.height = window.getComputedStyle(qualitySet[0]).height * Object.keys(movieInfo._info._quality).length + "px";
    const thisFunc = this;
    myButtonDom.onclick = function(){       // 마우스 조작 설정
      const set = Redux.getState().videoMenuSet;
      set.isQualityOpened = !set.isQualityOpened;
      thisFunc.foldMenu(myButtonDom, set.isQualityOpened);
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});

      for(let i = 0 ; i < videoQualityMenu.childNodes.length ; i++){      // 현재 선택한 해상도 표시
        if(videoQualityMenu.childNodes[i].childNodes[0].innerHTML == set.curQuality)
          videoQualityMenu.childNodes[i].className = "videoQualitySet curContents";
        else
          videoQualityMenu.childNodes[i].className = "videoQualitySet";
      }
    };
    myButtonDom.onmouseleave = function(){
      let set = Redux.getState().videoMenuSet;
      set.isQualityOpened = false;
      set.isSubOpened = false;
      thisFunc.foldMenu(myButtonDom, set.isQualityOpened);
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
    };

    myButtonDom.ontouchstart = function(){        // 터치 조작 설정
      const set = Redux.getState().videoMenuSet;
      set.isQualityOpened = !set.isQualityOpened;
      set.isSubOpened = false;
      thisFunc.foldMenu(myButtonDom, set.isQualityOpened);
      thisFunc.foldMenu(document.querySelector('[title="Subtitle"]'), set.isSubOpened);
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});

      for(let i = 0 ; i < videoQualityMenu.childNodes.length ; i++){      // 현재 선택한 해상도 표시
        if(videoQualityMenu.childNodes[i].childNodes[0].innerHTML == set.curQuality)
          videoQualityMenu.childNodes[i].className = "videoQualitySet curContents";
        else
          videoQualityMenu.childNodes[i].className = "videoQualitySet";
      }
    };
  }

  setSubtitle(player, movieInfo){       // 자막 메뉴 처리
    var myButton = player.controlBar.addChild("button");
    var myButtonDom = myButton.el();

    myButtonDom.title = "Subtitle";
    myButtonDom.classList.add("vjs-play-control");
    myButtonDom.childNodes[0].className = "vjs-play-subs";
    myButtonDom.innerHTML += `<div class="videoSubMenu"><ul></ul></div>`;
    const videoSubMenu = document.getElementsByClassName("videoSubMenu")[0].childNodes[0];  // 자막 메뉴 설정
    let langList = [];

    const subInfo = movieInfo._info._sub;
    for(let i = 0 ; i < Object.keys(subInfo).length ; i++){
      const srcLang = Object.keys(subInfo)[i];
      const label = Object.values(subInfo)[i]._label;
      langList.push(srcLang);
      videoSubMenu.innerHTML += `<li class="subtitleSet"><p>${label}</p></li>`;
    }
    videoSubMenu.innerHTML += `<li class="subtitleSet"><p>off</p></li>`;
    const subSet = document.getElementsByClassName("subtitleSet");
    let set = Redux.getState().videoMenuSet;
    set.curSub = "한국어";          // 기본 자막은 한국어로 설정
    Redux.dispatch({type:'setVideoMenu', videoMenuSet: set});

    for(let i = 0 ; i < subSet.length ; i++){
      subSet[i].onclick = function(){         // 마우스 조작 설정
        let tracks = player.textTracks();
        let set = Redux.getState().videoMenuSet;
        for (var j = 0 ; j < tracks.length ; j++) {
          tracks[j].mode = 'hidden';
          if(subSet[i].childNodes[0].innerHTML == 'off'){
            set.curSub = "off";
          } else if(subSet[i].childNodes[0].innerHTML != 'off' && tracks[j].language == langList[i]) {
            tracks[j].mode = 'showing';
            set.curSub = tracks[j].label;
          }
        }
        Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
      }
      subSet[i].ontouchstart = function(){      // 터치 조작 설정
        var tracks = player.textTracks();        // 모바일은 track 수가 pc에 비해 1개 적음
        let set = Redux.getState().videoMenuSet;
        for (var j = 0 ; j < tracks.length ; j++) {
          tracks[j].mode = 'hidden';
          if(subSet[i].childNodes[0].innerHTML == 'off'){
            set.curSub = "off";
          } else if (subSet[i].childNodes[0].innerHTML != 'off' && tracks[j].language == langList[i]) {
            tracks[j].mode = 'showing';
            set.curSub = tracks[j].label;
          }
        }
        Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
      }
    }
      // 메뉴 높이 설정
    videoSubMenu.style.height = window.getComputedStyle(subSet[0]).height * Object.keys(movieInfo._info._sub).length + "px";

    const thisFunc = this;
    myButtonDom.onclick = function(){
      const set = Redux.getState().videoMenuSet;
      set.isSubOpened = !set.isSubOpened;
      thisFunc.foldMenu(myButtonDom, set.isSubOpened);
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});

      for(let i = 0 ; i < videoSubMenu.childNodes.length ; i++){      // 현재 선택한 자막 표시
        if(videoSubMenu.childNodes[i].childNodes[0].innerHTML == set.curSub)
          videoSubMenu.childNodes[i].className = "subtitleSet curContents";
        else
          videoSubMenu.childNodes[i].className = "subtitleSet";
      }
    };
    myButtonDom.onmouseleave = function(){
      let set = Redux.getState().videoMenuSet;
      set.isQualityOpened = false;
      set.isSubOpened = false;
      thisFunc.foldMenu(myButtonDom, set.isSubOpened);
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
    };

    myButtonDom.ontouchstart = function(){
      const set = Redux.getState().videoMenuSet;
      set.isSubOpened = !set.isSubOpened;
      set.isQualityOpened = false;
      thisFunc.foldMenu(document.querySelector('[title="Quality"]'), set.isQualityOpened);
      thisFunc.foldMenu(myButtonDom, set.isSubOpened);
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});

      for(let i = 0 ; i < videoSubMenu.childNodes.length ; i++){      // 현재 선택한 자막 표시
        if(videoSubMenu.childNodes[i].childNodes[0].innerHTML == set.curSub)
          videoSubMenu.childNodes[i].className = "subtitleSet curContents";
        else
          videoSubMenu.childNodes[i].className = "subtitleSet";
      }
    };
  }

  setPiP(player, movieInfo){          // PiP메뉴 처리
    const { NormalToPiP, PiPtoNormal } = this.props;
    var myButton = player.controlBar.addChild("button");
    var myButtonDom = myButton.el();
    const thisFunc = this;

    myButtonDom.title = "Picture in Picture";
    myButtonDom.classList.add("vjs-play-control");
    myButtonDom.childNodes[0].className = "vjs-play-pip vjs-play-pip-off";
    myButtonDom.onclick = function(){               // 마우스 조작 설정
      let set = Redux.getState().videoMenuSet;
      if(!set.isPiPMode){
        myButtonDom.childNodes[0].className = "vjs-play-pip vjs-play-pip-on";
        NormalToPiP(set, movieInfo._fileUrl);
      } else {
        myButtonDom.childNodes[0].className = "vjs-play-pip vjs-play-pip-off";
        PiPtoNormal(set);
      }
    };

    myButtonDom.ontouchstart = function(){          // 터치 조작 설정
      let set = Redux.getState().videoMenuSet;
      set.isSubOpened = false;
      set.isQualityOpened = false;
      thisFunc.foldMenu(document.querySelector('[title="Quality"]'), set.isSubOpened);
      thisFunc.foldMenu(document.querySelector('[title="Subtitle"]'), set.isQualityOpened);

      if(!set.isPiPMode){
        myButtonDom.childNodes[0].className = "vjs-play-pip vjs-play-pip-on";
        NormalToPiP(set, movieInfo._fileUrl);
      } else {
        myButtonDom.childNodes[0].className = "vjs-play-pip vjs-play-pip-off";
        PiPtoNormal(set);
      }
    };
  }

  foldMenu(dom, flag){        // 메뉴 여닫기 처리
    if(flag)
      dom.childNodes[2].style.display = "block";
    else
      dom.childNodes[2].style.display = "none";
  }

  closeMovie(){          // 영화가 종료됐을 때 처리
    document.getElementById("watchWrapper").style.top = "unset";
    document.getElementById("watchTeaser").style.display = "block";
    document.getElementById("watchMoveInfo").style.display = "block";
    document.getElementById("videoWrapper").style.display = "none";
    document.getElementById("commentMenu").style.display = "none";
    document.querySelector("footer").style.display = "block";
  }

  setWatchHistory(){      // DB에 있는 유저 정보 collection에 시청 기록 갱신
    const userInfo = Redux.getState().userInfo;
    if(userInfo != null){
      const { movieInfo } = this.props;
      const post = {};
      post.movieTitle = movieInfo._title;
      post.fileUrl = movieInfo._fileUrl;
      post.id = movieInfo._id;
      post.userEmail = userInfo.email;

      fetch('/api/user/setWatchHistory',{
          method :"PATCH",
          headers:{
            'content-type':'application/json'
          },
          body:JSON.stringify(post),
          credentials: 'include'
      }).then(res=>res.json())
          .then(data=>{
            if(data == false){
              ;
              // console.log("기록 갱신 실패");
            } else{
              Redux.dispatch({type:'setUserInfo', userInfo: data});
            }
          });
    }
  }

  checkiOS() {        // 기기가 ios인지 체크하는 함수
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }
}


export default VideoPlayerApp;
