import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import Redux from './redux';
import css from '../css/signUp.css';
const hash = require('../../../auth/hashInfo.js');
import signUpBannerImage from '../image/signUpBanner.png';

class SignUpApp extends Component {
  constructor(props){
    super(props);
    this.state = {
      nickName: null,
      email: null,
      password: null,
      redirect: null,
      isNickNameOK: false,
      isEmailOK: false,
      isPasswordOK: false
    }
    this.checkFormValue = this.checkFormValue.bind(this);
    this.submitSignUpForm = this.submitSignUpForm.bind(this);
    this.checkByteSize = this.checkByteSize.bind(this);
  }

  componentDidMount(){
    Redux.dispatch({type:'setCurPage', pageNickName: 'signUp'});
    const { hideUpperIcon } = this.props;
    hideUpperIcon();
  }

  render() {
    if(this.state.redirect){
      return <Redirect to={this.state.redirect} />
    }

    return (
      <div id="contentWrapper">
        <div id="signUpWrapper">
          <img id="signUpBanner" src={signUpBannerImage}></img>
          <div id="signUpUI">
            <h1>회원 가입</h1>
            <form onSubmit={this.submitSignUpForm} method="post">
              <input type="text" name="nickName" placeholder="nickname" id="formNickName" onChange={this.checkFormValue}/>
              <p id="alertNickName">닉네임을 입력해주세요.</p>
              <input type="text" name="email" placeholder="e-mail" id="formEmail" onChange={this.checkFormValue}/>
              <p id="alertEmail">이메일을 입력해주세요.</p>
              <input type="password" name="password" placeholder="password" id="formPassword" onChange={this.checkFormValue}/>
              <p id="alertPassword">비밀번호를 입력해주세요.</p>
              <input type="submit" value="Sign up" id="formButton"/>
            </form>
          </div>
        </div>
      </div>
    );
  }

  checkFormValue(e){        // 입력된 폼 데이터 체크
    const regNickName = /[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/;     // 특수 문자 체크
    const regEmail = /^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/;
    const regPassword = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+┼<>@\#$%&\'\"\\\(\=]/gi;

    let state = {};
    state[e.target.name] = e.target.value;
    this.setState(state);

    if(e.target.name == "nickName"){
      const curByteSize = this.checkByteSize(e);
      if(regNickName.test(e.target.value) && (curByteSize <= 16 && curByteSize >= 4)){
        document.getElementById("alertNickName").style.color = "#00FF00";
        document.getElementById("alertNickName").innerHTML = "통과!";
        this.setState({isNickNameOK: true});
      } else{
        document.getElementById("alertNickName").style.color = "red";
        document.getElementById("alertNickName").innerHTML = "닉네임은 4 ~ 16byte 이내의 한글, 영문, 숫자 조합만 가능합니다.";
        this.setState({isNickNameOK: false});
      }
    }
    else if(e.target.name == "email"){
      const curByteSize = this.checkByteSize(e);
      if(regEmail.test(e.target.value)){
        document.getElementById("alertEmail").style.color = "#00FF00";
        document.getElementById("alertEmail").innerHTML = "통과!";
        this.setState({isEmailOK: true});
      } else{
        document.getElementById("alertEmail").style.color = "red";
        document.getElementById("alertEmail").innerHTML = "올바른 형식의 이메일을 작성해주세요.";
        this.setState({isEmailOK: false});
      }
    }
    else if(e.target.name == "password"){
      const curByteSize = this.checkByteSize(e);
      if(regPassword.test(e.target.value) && (curByteSize <= 16 && curByteSize >= 8)){
        document.getElementById("alertPassword").style.color = "#00FF00";
        document.getElementById("alertPassword").innerHTML = "통과!";
        this.setState({isPasswordOK: true});
      } else{
        document.getElementById("alertPassword").style.color = "red";
        document.getElementById("alertPassword").innerHTML = "비밀번호는 특수문자 포함 8~16자 이내로만 가능합니다.";
        this.setState({isPasswordOK: false});
      }
    }
  }

  submitSignUpForm(e){        // 회원가입 폼 전송
    e.preventDefault();
    if(this.state.isNickNameOK && this.state.isEmailOK && this.state.isPasswordOK){
      const post = {
        name: this.state.nickName,
        email: this.state.email,
        password: hash.getHash(this.state.password),    // DB에 비밀번호를 암호화해서 저장
      }

      fetch('/api/auth/signUpProcess',{
          method :"POST",
          headers:{
            'content-type':'application/json'
          },
          body:JSON.stringify(post),
          credentials: 'include'
      }).then(res=>res.json())
          .then(data=>{
            if(data){
              console.log("가입 성공");
              this.setState({redirect: '/auth/login'});
            }
            else{
              alert("중복된 닉네임이나 이메일을 입력하셨습니다.");
              console.log("가입 실패");
            }
          });
    }
  }

  checkByteSize(e){     // 현재 form의 글자수를 체크하는 함수
      // UTF-8은 한글 3byte 영어 1byte
    let curByteSize = (function(s,b,i,c){
      for(b=i=0 ; c=s.charCodeAt(i++) ; b+=c>>11?3:c>>7?2:1) ;
      return b
    })(e.target.value);
    return curByteSize;
  }
}

export default SignUpApp;
