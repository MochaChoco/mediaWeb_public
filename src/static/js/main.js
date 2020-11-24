import React, { Component } from 'react';
import Cookies from 'js-cookie';
import { BrowserRouter as Router, Redirect, Switch, Route, Link } from 'react-router-dom';
import Redux from './redux';
import AuthCheck from './checkPage';
import Login from './login';
import SignUp from './signUp';
import Header from './header';
import Footer from './footer';
import Index from './index';
import Watch from './watch';
import MyInfo from './myInfo';
import SearchResult from './searchResult';
import MyScrap from './myScrap';
import MyMovieVote from './myMovieVote';
import videojs from 'video.js';
import css from '../css/main.css';

class MainApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMobile: false
    }

    this.logOutUser = this.logOutUser.bind(this);
    this.checkIsLogin = this.checkIsLogin.bind(this);
    this.getMovieInfo = this.getMovieInfo.bind(this);
    this.showUpperIcon = this.showUpperIcon.bind(this);
    this.hideUpperIcon = this.hideUpperIcon.bind(this);
    this.checkPiP = this.checkPiP.bind(this);
    this.getMovieInfo();

    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.state.isMobile = true;
    }

    if(!this.state.isMobile)
      console.log("access device : PC");
    else
      console.log("access device : mobile");
  }

  render() {
    var store = Redux.getState();
    return (
      <div style={{position: "relative"}}>
      <Header isMobile={this.state.isMobile} userInfo={store != undefined ? store.userInfo : null } logOutUser={this.logOutUser} isLogined={store != undefined ? store.isLogined : false} checkIsLogin={this.checkIsLogin}/>
        <Switch>                    // true : 로그인 시에만 접속 가능
          <AuthCheck                // false : 로그인 시 접속 불가
            path="/auth/login"      // null : 상관없음
            accessibleLoginStatus={false}   // accessibleLoginStatus = 로그인 필요 여부
            component={Login}
            hideUpperIcon = {this.hideUpperIcon}
          />
          <AuthCheck
            path="/auth/signUp"
            accessibleLoginStatus={false}
            component={SignUp}
            hideUpperIcon = {this.hideUpperIcon}
          />
          <AuthCheck
            path="/watch=:id"
            accessibleLoginStatus={null}
            component={Watch}
            movieInfo={store != undefined ? store.movieInfo : null}
            userInfo = {store != undefined ? store.userInfo : null}
            showUpperIcon = {this.showUpperIcon}
          />
          <AuthCheck
            path="/index/:id"
            accessibleLoginStatus={null}
            component={Index}
            checkPiP={this.checkPiP}
            showUpperIcon = {this.showUpperIcon}
          />
          <AuthCheck
            path="/myInfo"
            accessibleLoginStatus={true}
            isMobile={this.state.isMobile}
            component={MyInfo}
            checkPiP={this.checkPiP}
          />
          <AuthCheck
            path="/search"
            accessibleLoginStatus={null}
            component={SearchResult}
            movieInfo={store != undefined ? store.movieInfo : null}
            showUpperIcon = {this.showUpperIcon}
          />
          <AuthCheck
            path="/myScrap"
            accessibleLoginStatus={true}
            component={MyScrap}
            checkPiP={this.checkPiP}
            userInfo = {store != undefined ? store.userInfo : null}
            showUpperIcon = {this.showUpperIcon}
          />
          <AuthCheck
            path="/myMovieVote"
            accessibleLoginStatus={true}
            component={MyMovieVote}
            checkPiP={this.checkPiP}
            userInfo = {store != undefined ? store.userInfo : null}
            showUpperIcon = {this.showUpperIcon}
          />
          <Redirect path="*" to="/index/1" />
        </Switch>
        <Footer />
      </div>
    );
  }


  /* 로그인과 회원가입 창에선 아이콘이 안보이도록 설정한다. */
  showUpperIcon(){      // header에 아이콘 보이도록 설정
    document.getElementById("headerIconWrapper").style.display = "block";
  }

  hideUpperIcon(){      // header에 아이콘 숨기도록 설정
    document.getElementById("headerIconWrapper").style.display = "none";
  }

  logOutUser(e){        // 로그아웃 처리
    e.stopPropagation();
    fetch('/api/user/logOutUser',{
      headers : {
        'content-yype': 'application/json',
        'accept': 'application/json'
      },
      credentials: 'include'
    }).then(res=>res.json())
        .then(data=>{
            Cookies.remove('name');
            window.location.href = '/index/1';
        });
  }

  checkIsLogin(callbackFunc){       // 쿠키와 세션을 활용하여 현재 유저가 로그인이 되있는지 체크
    if((Cookies.get('name') == undefined)){      // 페이지에 들어왔는데 쿠키가 없을 때
      callbackFunc();
    } else {   // 쿠키가 있다면 서버에서 인증을 확인하는 속도가 페이지 로딩보다 느리므로 임시로 쿠키에 있는 값을 넣어줌
      var info = {};
      info.name = Cookies.get('name');
      Redux.dispatch({type:'setIsLogin', isLogined: true});
      Redux.dispatch({type:'setUserInfo', userInfo: info});   // userInfo 형식을 유지함.

      fetch('/api/user/checkSession', {    // 현재의 세션이 유효한지 검사
        headers : {
          'content-yype': 'application/json',
          'accept': 'application/json'
        },
        credentials: 'include'
      }).then(res=>res.json())
          .then(data=>{
            if(data != false){
              delete info.id;    // userInfo에 id값은 불필요하므로 제거
              info.email = data.email;
              info.profileImage = data.profileImage;
              info.myScrap = data.myScrap;
              info.myMovieVote = data.myMovieVote;
              info.myCommentVote = data.myCommentVote;
              info.myCommentHistory = data.myCommentHistory;
              info.myWatchHistory = data.myWatchHistory;
              console.log("getting userInfo is success!");
              Redux.dispatch({type:'setUserInfo', userInfo: info});
              callbackFunc();
            } else {
              // 인증이 실패했으면 index/1 페이지로 리다이렉트 처리한다.
              console.log("쿠키 인증 실패");
              Cookies.remove('name');
              window.location.href = '/index/1';
            }
          });
    }
  }

  getMovieInfo(){       // DB에서 영화 정보 object 가져옴
    fetch('/api/movie/getMovieInfo',{
      headers : {
        'content-yype': 'application/json',
        'accept': 'application/json'
      },
      credentials: 'include'
    }).then(res=>res.json())
        .then(data=>{
          console.log("getting MovieInfo is success!");
          Redux.dispatch({type:'setMovieInfo', movieInfo: data});
        });
  }

  checkPiP(url){          // 특정 watch 페이지 진입 시 pip 모드 원복시킬지 결정
    const set = Redux.getState().videoMenuSet;
    if(set.isPiPMode && set.curVideoURL != url)
    {
      const pipWindow = document.getElementById("pipWindow");
      const pipContent = pipWindow.childNodes[0];
      const watchPlayer = document.getElementById('watchPlayer');
      videojs(watchPlayer).dispose();
      pipWindow.classList.add("pipHide");
      pipContent.innerHTML = '';
      set.isPiPMode = false;
      set.curVideoURL = null;
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
    }
  }
}

export default MainApp;
