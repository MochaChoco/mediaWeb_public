import React, { Component } from 'react';
import Redux from './redux';
import css from '../css/myInfo.css';
import MyHistory from './myHistory';
import defaultProfileImage from '../image/icon/profile_thumb.png';
import defaultProfilePopUpImage from '../image/icon/noProfileImage.png';
import myInfoBannerImage from '../image/myInfoBanner.png';

class MyInfoApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      history : null,
      type: null,
    }

    this.openImagePopup = this.openImagePopup.bind(this);
    this.closeImagePopup = this.closeImagePopup.bind(this);
    this.showPreviewProfile = this.showPreviewProfile.bind(this);
    this.submitProfileImage = this.submitProfileImage.bind(this);
    this.changeProfileImage = this.changeProfileImage.bind(this);
    this.closeHistoryPopUp = this.closeHistoryPopUp.bind(this);
    this.setHistory = this.setHistory.bind(this);

    this.fileInput = React.createRef();
  }

  componentDidMount(){
    Redux.dispatch({type:'setCurPage', pageName: 'myInfo'});
  }

  componentWillUnmount(){
    document.getElementsByTagName('body')[0].classList.remove('preventScroll');
  }

  render() {
    const userInfo = Redux.getState().userInfo;
    const { checkPiP, isMobile } = this.props;
    const { history, type } = this.state;
    let historyContents = [];
    if(history != null && type != null){
      historyContents = history;
    }

    this.changeProfileImage();

    return (
      <div id="contentWrapper">
        <div id="myInfoWrapper">
          <img id="myInfoBanner" src={myInfoBannerImage}></img>
          <div id="myInfoUIWrapper">
            <div id="myInfoUI">
              <div id="profileImageDiv">
                <img id="profileImage"></img>
                <div id="openImagePopup" onClick={this.openImagePopup}></div>
              </div>
              <div id="profileMyName">
                <h3>닉네임</h3>
                <h1>{userInfo ? userInfo.name : ''}</h1>
              </div>
              <div id="profileMyEmail">
                <h3>이메일 주소</h3>
                <h1>{userInfo ? userInfo.email : ''}</h1>
              </div>
              <div id="MyHistory">
                <MyHistory isMobile={isMobile} userInfo={userInfo} checkPiP={checkPiP} setHistory={this.setHistory}/>
              </div>
            </div>
            <div id="changeImagePopup">
              <img id="previewImage" src={defaultProfilePopUpImage}></img>
              <form id="profileIconForm" onSubmit={this.submitProfileImage} method="post" encType="multipart/form-data">
                <input type="file" name="profileIconImage" id="uploadProfileImage" onChange={this.showPreviewProfile} ref={this.fileInput} accept="image/png, image/jpeg"/>
                <label htmlFor="uploadProfileImage"><p>업로드</p></label>
                <input type="submit" name="submit" id="submitProfileImage" value="제출"/>
              </form>
              <span id="closeImagePopup" onClick={this.closeImagePopup}>&times;</span>
            </div>
            <div id="historyPoPup">
              {historyContents}
              <div id="historyPoPupCloseButton" onClick={this.closeHistoryPopUp}>&times;</div>
            </div>
          </div>
          <div id="popupBackground">
          </div>
        </div>
      </div>
    );
  }

  openImagePopup(){           // 이미지 팝업 띄우기
    document.getElementsByTagName('body')[0].classList.add('preventScroll');
    document.getElementById("previewImage").style.content = '';
    document.getElementById("changeImagePopup").style.display = "block";
    document.getElementById("popupBackground").style.display = "block";
  }

  closeImagePopup(){          // 이미지 팝업 숨김
    document.getElementsByTagName('body')[0].classList.remove('preventScroll');
    document.getElementById("changeImagePopup").style.display = "none";
    document.getElementById("popupBackground").style.display = "none";
    document.getElementById("previewImage").src = defaultProfilePopUpImage;
  }

  showPreviewProfile(e){            // 변경한 프로필 사진 미리보기
    if (e.target.files && e.target.files[0]) {
      const input = e.target;
      const file = input.files[0];
      if(file.size > 1024 * 40){    // 크기는 40kb로 제한함
        alert("40kb 크기 이하의 이미지만 사용 가능합니다.");
        input.value = '';      // 폼 리셋
        return;
      }

      const imgSrc = URL.createObjectURL(e.target.files[0]);    // 임시 경로 할당
      const previewImage = document.getElementById("previewImage");
      let img = new Image();

      img.onload = function () {
        if(this.width / this.height > 0.95 && this.width / this.height < 1.05){   // 이미지가 1:1 비율에 근접한지 검사
          const src = URL.createObjectURL(file);  // 임시 경로 할당
          previewImage.onload = function(){
            URL.revokeObjectURL(src);   // 임시 경로 제거
          }
          previewImage.src = src;
        } else{
          alert("사진의 가로, 세로 길이 차이가 5% 이내여야 합니다.");
          input.value = '';      // 폼 리셋
        }
        URL.revokeObjectURL(imgSrc);    // 임시 경로 제거
        return;
      }
      img.src = imgSrc;
    }
  }

  submitProfileImage(e){          // 프로필 사진 서버에 올림
    e.preventDefault();
    var formData = new FormData();
    formData.append("profileIconImage", e.target.profileIconImage.files[0]);
    formData.append("email", Redux.getState().userInfo.email);
    formData.append("profileImage", Redux.getState().userInfo.profileImage);
    if(e.target.profileIconImage.files[0] != undefined){
      fetch('/api/user/submitProfileImage',{
          method :"PATCH",
          body: formData,
          credentials: 'include'
      }).then(res=>res.json())
          .then(data=>{
            if(data == false){
              console.log("프로필 이미지 업로드 실패");
            } else{
              console.log("프로필 이미지 업로드 성공");
              Redux.dispatch({type:'setProfileImage', profileImage: data.profileImage});
              this.fileInput.current.value = '';
              this.changeProfileImage();        // 프로필 사진 갱신
              this.closeImagePopup();           // 이미지 팝업 닫기
            }
          });
    } else{
      alert("파일을 먼저 업로드해주세요.");
    }
  }

  changeProfileImage(){       // 프로필 사진 변경 함수
    const userInfo = Redux.getState().userInfo;
    const profileImage = document.getElementById("profileImage");
    if(profileImage != null){
      if(userInfo.profileImage != ''){
        profileImage.setAttribute("src", userInfo.profileImage);
      } else{
        profileImage.setAttribute("src", defaultProfileImage);
      }
    }
  }

  closeHistoryPopUp(){          // 프로필 변경창 닫기 함수
    document.getElementsByTagName('body')[0].classList.remove('preventScroll');
    const popUpBackground = document.getElementById("popupBackground");
    const popUpWindow = document.getElementById("historyPoPup");
    popUpBackground.style.display = "none";
    popUpWindow.style.display = "none";
  }

  setHistory(history, type){          // myHistory 컴포넌트에서 history 정보 object 받음
    this.setState({history: history, type: type});
  }
}

export default MyInfoApp;
