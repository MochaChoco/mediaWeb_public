import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Redux from './redux';
import Cookies from 'js-cookie';
import css from '../css/login.css';
const hash = require('../../../auth/hashInfo.js');
import loginBannerImage from '../image/loginBanner.png';

class LoginApp extends Component {
  constructor(props){
    super(props);
    this.state = {
      email: null,
      password: null
    }
    this.changeValue = this.changeValue.bind(this);
    this.submitLoginForm = this.submitLoginForm.bind(this);
    this.saveLoginEmail = this.saveLoginEmail.bind(this);
    this.loadLoginEmail = this.loadLoginEmail.bind(this);
  }

  componentDidMount(){
    Redux.dispatch({type:'setCurPage', pageName: 'login'});
    const { hideUpperIcon } = this.props;
    hideUpperIcon();

    this.loadLoginEmail();
  }

  render() {
    return (
      <div id="contentWrapper">
        <div id="loginWrapper">
          <img id="loginBanner" src={loginBannerImage}/>
          <div id="loginUI">
            <h1>로그인</h1>
            <form id="loginForm" onSubmit={this.submitLoginForm} method="post">
              <input type="text" name="email" placeholder="e-mail" id="formEmail" onChange={this.changeValue}/>
              <input type="password" name="password" placeholder="password" id="formPassword" onChange={this.changeValue}/>
              <input type="submit" value="Login" id="formButton"/>
              <div id="formLoginCheckBoxWrapper">
                <input id="loginCheckBox" type="checkBox"/><span>이메일 저장</span>
              </div>
            </form>
            <div id="signUpTextWrapper">
              <span id="signUpText">회원 정보가 없으시다구요? </span><Link to='/auth/signUp' id="signUpButton">회원으로 등록하세요.</Link>
            </div>
            <p id="alertLoginMessage"></p>
          </div>
        </div>
      </div>
    );
  }

  changeValue(e){     // 값 변경 체크
    let state = {};
    state[e.target.name] = e.target.value;
    this.setState(state);
  }

  submitLoginForm(e){       // 로그인 폼 제출 처리
    e.preventDefault();
    const loginMessage = document.getElementById("alertLoginMessage");

    if(this.state.email && this.state.password){
      const post = {
        email: this.state.email,
        password: hash.getHash(this.state.password),
      }

      fetch('/api/auth/loginProcess',{
          method :"POST",
          headers:{
            'content-type':'application/json'
          },
          body:JSON.stringify(post),
          credentials: 'include'
      }).then(res=>res.json())
          .then(data=>{
            if(data == false){
              // console.log("로그인 실패");
              loginMessage.innerHTML = "이메일 또는 비밀번호가 틀렸습니다.";
            } else{
              // console.log("로그인 성공");
              this.saveLoginEmail();
              Cookies.set('name', data.name, {expires: 7});
              Redux.dispatch({type:'setIsLogin', isLogined: true});
              Redux.dispatch({type:'setUserInfo', userInfo: data});
              window.location.href = '/index/1';
            }
          });
    } else{
      loginMessage.innerHTML = "이메일 또는 비밀번호가 누락되었습니다.";
    }
  }

  saveLoginEmail(){       // 아이디 저장 기능 사용할 때 처리
    if(document.getElementById("loginCheckBox").checked)
      Cookies.set('savedId', this.state.email);
    else
      Cookies.remove('savedId');
  }

  loadLoginEmail(){       // 쿠키에 저장된 아이디 불러오기
    if(Cookies.get('savedId') != undefined){
      document.getElementById("formEmail").value = Cookies.get('savedId');
      document.getElementById("loginCheckBox").checked = true;
      this.setState({email: Cookies.get('savedId')});
    }
  }
}

export default LoginApp;
