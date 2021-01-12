import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import Redux from './redux';
import css from '../css/header.css';
import CheckPage from './checkPage';
import defaultProfileImage from '../image/icon/profile_thumb.png';
import searchCloseIcon from '../image/icon/searchCloseButton.png';
import SetPiP from './pipWindow.js';

class HeaderApp extends Component {
  constructor(props) {
    super(props);

    this.showSearchField = this.showSearchField.bind(this);
    this.hideSearchField = this.hideSearchField.bind(this);
    this.setHeaderTransparent = this.setHeaderTransparent.bind(this);
    this.foldProfileMenu = this.foldProfileMenu.bind(this);
    this.showProfileMenu = this.showProfileMenu.bind(this);
    this.hideProfileMenu = this.hideProfileMenu.bind(this);
    this.setHeaderMenu = this.setHeaderMenu.bind(this);
    this.submitSearchForm = this.submitSearchForm.bind(this);

    const set = {
      isQualityOpened : false,
      isSubOpened : false,
      isPiPMode : false,
      isDirect : false,
      curVideoURL : null,
      curQuality: null,
      curSub: null,
      myCommentId: 0,
    }
    Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
  }

  componentDidMount(){
    const { checkIsLogin } = this.props;
    checkIsLogin(()=>{
    });
    window.addEventListener('scroll', this.setHeaderTransparent);   // 스크롤 이벤트 바인딩
    SetPiP('.resizable');
  }

  componentWillUnmount(){
    window.removeEventListener('scroll', this.setHeaderTransparent);  // 스크롤 이벤트 바인딩 해제
  }

  render() {
    const userInfo = Redux.getState().userInfo;

    return (
      <header>
        <div id="headerWrapper">
          <div className="headerUpper" onScroll={this.setHeaderTransparent}>
            <Link to='/index/1' id="headerLogo"><p>&nbsp;Movie&nbsp; & &nbsp;Trailer</p></Link>
            <div id="headerTopMenuWrapper">
            <ul>
              <li><Link to='/myScrap' id="myfavoriteButton"><p>내가 찜한 콘텐츠</p></Link></li>
              <li><Link to='/myMovieVote'><p>좋아요 누른 영상</p></Link></li>
            </ul>
            </div>
            <div id="headerIconWrapper">
            {this.setHeaderMenu(userInfo)}
            </div>
          </div>
        </div>
        <div id="pipWindow" className="resizable pipHide">
          <div id="pipContent"></div>
          <div className="mover"></div>
          <div className='resizer top'></div>
          <div className='resizer right'></div>
          <div className='resizer bottom'></div>
          <div className='resizer left'></div>
          <div className='resizer top-left'></div>
          <div className='resizer top-right'></div>
          <div className='resizer bottom-left'></div>
          <div className='resizer bottom-right'></div>
        </div>
      </header>
    );
  }

  setHeaderTransparent(e){       // 스크롤이 내려왔을 때 헤더 부분을 최소화하는 함수
    const headerUpper = document.getElementsByClassName("headerUpper")[0];
    if (e.srcElement.scrollingElement.scrollTop > 50 && headerUpper.className == "headerUpper") {   // scroll의 Top이 50이 넘으면 헤더 애니메이션 처리
      headerUpper.classList.add("transparentON");
    }
    else if(e.srcElement.scrollingElement.scrollTop <= 50 && headerUpper.className == "headerUpper transparentON"){
      headerUpper.classList.remove("transparentON");
    }
  }

  showSearchField(e){       // 검색창 클릭(터치)했을 때 보여주는 처리
    const { isMobile } = this.props;
    if(isMobile && e.nativeEvent.type == "click")     // 모바일 환경에서 클릭과 터치 동시에 되는 것을 방지
      return;

    if((isMobile && window.innerWidth < 980) || (!isMobile && window.innerWidth < 500))
      document.querySelector("#headerLogo p").classList.add("hideheaderLogo");

    document.getElementsByClassName("headerSearchIcon")[0].classList.add("showHeaderSearchIcon");
    document.getElementsByClassName("headerSearchForm")[0].classList.add("showHeaderSearch");
  }

  hideSearchField(e){   // 검색창 숨김 처리
    const { isMobile } = this.props;
    if(isMobile && e.nativeEvent.type == "click")     // 모바일 환경에서 클릭과 터치 동시에 되는 것을 방지
      return;

    if((isMobile && window.innerWidth < 980) || (!isMobile && window.innerWidth < 500))
      document.querySelector("#headerLogo p").classList.remove("hideheaderLogo");

    document.getElementsByClassName("headerSearchIcon")[0].classList.remove("showHeaderSearchIcon");
    document.getElementsByClassName("headerSearchForm")[0].classList.remove("showHeaderSearch");
    document.getElementById("headerSearch").value = '';
  }

  foldProfileMenu(e){     // profile 메뉴의 class 상태를 판단하여 올바른 함수 호출
    const { isMobile } = this.props;
    if(isMobile && e.nativeEvent.type == "click")     // 모바일 환경에서 클릭과 터치 동시에 되는 것을 방지
      return;

    const profileMenu = document.getElementsByClassName("profileMenu")[0];
    if(!profileMenu.classList.contains("showProfileMenu"))
      this.showProfileMenu();
    else
      this.hideProfileMenu();
  }

  showProfileMenu(){      // profile 메뉴 나타내는 함수
    document.getElementsByClassName("profileMenu")[0].classList.add("showProfileMenu");
  }

  hideProfileMenu(){      // profile 메뉴 숨김처리 하는 함수
    document.getElementsByClassName("profileMenu")[0].classList.remove("showProfileMenu");
  }

  setHeaderMenu(userInfo){        // header가 rendering 될 때 헤더 메뉴 표시하는 함수
    const favoriteMenu = document.querySelector("#headerTopMenuWrapper ul");
    const { logOutUser } = this.props;

    if(!userInfo){
      if(favoriteMenu != null)          // 로그인 안했을 시 '내가 찜한 콘텐츠' 메뉴 숨김 처리
        favoriteMenu.style.display = "none";
      return (
        <ul key="headerSearchWrapperLoginOFF">
          <li>
            <div id="headerSearchWrapper">
              <div className="headerSearchIcon" onClick={this.showSearchField} onTouchStart={this.showSearchField}></div>
              <form autoComplete="off" className="headerSearchForm" onSubmit={this.submitSearchForm}>
                <input type="text" id="headerSearch" name="keyword" placeholder="제목, 사람, 장르"></input>
                <img id="searchCloseButton" src={searchCloseIcon} onClick={this.hideSearchField} onTouchStart={this.hideSearchField}/>
              </form>
            </div>
          </li>
          <li>
            <Link to='/auth/login' id="headerLoginIcon"></Link>
          </li>
        </ul>);
    } else{       // 유저가 로그인했을 때 처리
      if(favoriteMenu != null)
        document.getElementById("myfavoriteButton").style.display = "block";

      const profileIcon = document.getElementById("profileIconImage");
      if(profileIcon){
        if(Redux.getState().userInfo.profileImage != ''){
          profileIcon.setAttribute("src", Redux.getState().userInfo.profileImage);
        } else{
          profileIcon.setAttribute("src", defaultProfileImage);
        }
      }
      return (
        <ul key="headerSearchWrapperLoginON">
          <li>
            <div id="headerSearchWrapper">
              <div className="headerSearchIcon" onClick={this.showSearchField} onTouchStart={this.showSearchField}></div>
              <form autoComplete="off" className="headerSearchForm" onSubmit={this.submitSearchForm}>
                <input type="text" id="headerSearch" name="keyword" placeholder="제목, 사람, 장르"></input>
                <img id="searchCloseButton" src={searchCloseIcon} onClick={this.hideSearchField} onTouchStart={this.hideSearchField}/>
              </form>
            </div>
          </li>
          <li id="minWebScrapIcon">
            <Link to='/myScrap'></Link>
          </li>
          <li id="minWebMovieVoteIcon">
            <Link to='/myMovieVote'></Link>
          </li>
          <li>
            <div id="profileIcon">
              <img id="profileIconImage" onClick={this.foldProfileMenu} onTouchStart={this.foldProfileMenu}/>
              <div className="profileMenu" onMouseLeave={this.hideProfileMenu}>
                <ul>
                  <li><Link to='/myInfo' id="headerMyInfoLink"><p>내 계정 관리</p></Link></li>
                  <li><div id="headerLogoutButton" onClick={logOutUser}><p>로그아웃</p></div></li>
                </ul>
              </div>
            </div>
          </li>
        </ul>);
    }
  }

  submitSearchForm(e){      // 검색창에 입력한 텍스트 검증 작업
    e.preventDefault();
    const regText = /^[^\`|^'|^"|^<|^>|^(|^)|^.|^=]+$/;       // '나 \`등 코드에 영향 줄 수 있는 특수 문자가 있는지 체크하는 정규식

    if(e.target.keyword.value != ''){
      if(!regText.test(e.target.keyword.value)){
        alert("키워드에 사용 불가능한 특수 문자가 포함되어 있습니다.");
        return;
      }

      const { history } = this.props;
      const url = '/search?keyword=' + e.target.keyword.value;
      history.replace(url);
    } else{
      alert("검색 키워드를 입력해주세요.");
    }
  }
}

export default withRouter(HeaderApp);   // this.props.history를 불러오기 위해 감싸줘야함
