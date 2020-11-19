import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Redux from './redux';
import css from '../css/teaser.css';

class TeaserApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curSlideNum: 1,
      intervalId: null,
    }
    this.createSlide = this.createSlide.bind(this);
    this.slideMove = this.slideMove.bind(this);
    this.roofSlide = this.roofSlide.bind(this);
    this.resizeSlideGroup = this.resizeSlideGroup.bind(this);
  }

  componentDidMount() {
    window.addEventListener("resize", this.resizeSlideGroup);
    this.roofSlide(1);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeSlideGroup);
    clearInterval(this.state.intervalId);
  }

  componentDidUpdate(){
    const slideGroup = document.getElementById("slideGroup");
    const slideDom = document.getElementsByClassName("slide");
    if(slideDom.length > 0)
      slideGroup.style.width = window.getComputedStyle(slideDom[0]).width.split("px")[0] * slideDom.length + "px";
  }

  render() {
    const { movieInfo } = this.props;
    let slide = [];
    if(movieInfo != null && movieInfo.length > 0){
      slide = this.createSlide(movieInfo);
    }

    return (
      <div id="movieTeaser">
        <div id="slideGroup">
          {slide}
        </div>
        <div className="slideButton prevSlideButton" onClick={()=>this.slideMove(-1)}>&#10094;</div>
        <div className="slideButton nextSlideButton" onClick={()=>this.slideMove(1)}>&#10095;</div>
      </div>
    );
  }

  resizeSlideGroup(){     // 윈도우 창 크기 조절시 teaser 컴포넌트 처리
    const slideGroup = document.getElementById("slideGroup");
    const slide = document.getElementsByClassName("slide");
    clearInterval(this.state.intervalId);     // 타이머 일시 정지
    if(slide[0] != undefined) {      // vw로 값을 주면 창 크기 조절시 경우에따라 값이 반올림 되는 경우도 있어서 div 크기가 정확하게 조절되지 않는다.
      slideGroup.style.transition = "none";
      slideGroup.style.left = parseFloat(-this.state.curSlideNum * parseFloat(window.getComputedStyle(slide[0]).width.split("px")[0])) + "px";
    }
    this.roofSlide(1);
  }

  createSlide(movieInfo){       // 영화 정보 object에서 dom으로 변환하는 함수
    const { checkPiP } = this.props;
    let res = [];
    let newMovieList = [];

    for(let i = 0 ; i < movieInfo.length; i++){
      for(let j = 0 ; j < movieInfo[i]._tag.length ; j++){
        if(movieInfo[i]._tag[j] == 'new')
          newMovieList.push(movieInfo[i]);
      }
    }

        // 맨 처음 슬라이드는 맨 마지막 슬라이드와 동일하게 생성해서 눈속임 처리
    res.push(
      <div className="slide first" key={0}>
        <img className="movieTeaserImage" src={newMovieList != undefined ? newMovieList[newMovieList.length - 1]._fileUrl + newMovieList[newMovieList.length - 1]._teaser.image : null}></img>
        <div className="movieTeaserBackground"></div>
        <div className="movieTeaserInfo">
          <img className="teaserLogo" src={newMovieList != undefined ? newMovieList[newMovieList.length - 1]._fileUrl + newMovieList[newMovieList.length - 1]._teaser.logo : null} draggable="false"></img>
          <p className="teaserDescription">{newMovieList != undefined ? newMovieList[newMovieList.length - 1]._teaser.description : null}</p>
          <div className="teaserButtonWrapper">
            <div className="showTeaserMovie">
              <span>
                <div></div>
                <p>재생</p>
              </span>
              <Link to= {`${'/watch=' + newMovieList[newMovieList.length - 1]._id}`} className="movieLink"
                onClick={()=>{
                  checkPiP(newMovieList[newMovieList.length - 1]._fileUrl);
                  const set = Redux.getState().videoMenuSet;
                  set.isDirect = true;
                  Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
                }}>
              </Link>
            </div>
            <div className="showTeaserInfo">
              <span>
                <div></div>
                <p>상세 정보</p>
              </span>
              <Link to= {`${'/watch=' + newMovieList[newMovieList.length - 1]._id}`} className="movieLink" onClick={()=>checkPiP(newMovieList[newMovieList.length - 1]._fileUrl)}></Link>
            </div>
          </div>
        </div>
      </div>
    );

    for(let i = 0 ; i < newMovieList.length; i++){
      res.push(
        <div className="slide" key={i + 1}>
          <img className="movieTeaserImage" src={newMovieList != undefined ? newMovieList[i]._fileUrl + newMovieList[i]._teaser.image : null}></img>
          <div className="movieTeaserBackground"></div>
          <div className="movieTeaserInfo">
            <img className="teaserLogo" src={newMovieList != undefined ? newMovieList[i]._fileUrl + newMovieList[i]._teaser.logo : null} draggable="false"></img>
            <p className="teaserDescription">{newMovieList != undefined ? newMovieList[i]._teaser.description : null}</p>
            <div className="teaserButtonWrapper">
              <div className="showTeaserMovie">
                <span>
                  <div></div>
                  <p>재생</p>
                </span>
                <Link to= {`${'/watch=' + newMovieList[i]._id}`} className="movieLink"
                  onClick={()=>{
                    checkPiP(newMovieList[i]._fileUrl);
                    const set = Redux.getState().videoMenuSet;
                    set.isDirect = true;
                    Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
                  }}>
                </Link>
              </div>
              <div className="showTeaserInfo">
                <span>
                  <div></div>
                  <p>상세 정보</p>
                </span>
                <Link to= {`${'/watch=' + newMovieList[i]._id}`} className="movieLink" onClick={()=>checkPiP(newMovieList[i]._fileUrl)}></Link>
              </div>
            </div>
          </div>
        </div>
      );
    }


        // 맨 마지막 슬라이드는 맨 처음 슬라이드와 동일하게 생성해서 눈속임 처리
    res.push(
      <div className="slide last" key={newMovieList.length + 1}>
        <img className="movieTeaserImage" src={newMovieList != undefined ? newMovieList[0]._fileUrl + newMovieList[0]._teaser.image : null}></img>
        <div className="movieTeaserBackground"></div>
        <div className="movieTeaserInfo">
          <img className="teaserLogo" src={newMovieList != undefined ? newMovieList[0]._fileUrl + newMovieList[0]._teaser.logo : null} draggable="false"></img>
          <p className="teaserDescription">{newMovieList != undefined ? newMovieList[0]._teaser.description : null}</p>
          <div className="teaserButtonWrapper">
            <div className="showTeaserMovie">
            <span>
              <div></div><p>재생</p>
            </span>
            <Link to= {`${'/watch=' + newMovieList[0]._id}`} className="movieLink"
              onClick={()=>{
                checkPiP(newMovieList[0]._fileUrl);
                const set = Redux.getState().videoMenuSet;
                set.isDirect = true;
                Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
              }}>
              </Link>
            </div>
            <div className="showTeaserInfo">
              <span>
                <div></div>
                <p>상세 정보</p>
              </span>
              <Link to= {`${'/watch=' + newMovieList[0]._id}`} className="movieLink" onClick={()=>checkPiP(newMovieList[0]._fileUrl)}></Link>
            </div>
          </div>
        </div>
      </div>
    );

    return res;
  }

  slideMove(direction){   // direction : -1은 슬라이드를 오른쪽에서 왼쪽, 1은 왼쪽에서 오른쪽으로 이동
    clearInterval(this.state.intervalId);     // 타이머 일시 정지
    const slideGroup = document.getElementById("slideGroup");
    const slide = document.getElementsByClassName("slide");
    slideGroup.style.transition = "all 1s";
    if(direction == -1){
      this.setState({curSlideNum: this.state.curSlideNum - 1}, function(){    // setState로 값을 변경해도 state의 값의 변경이 즉시 반영되지 않으므로 다음과 같은 방법으로 사용함.
        slideGroup.style.left = parseFloat(-this.state.curSlideNum * parseFloat(window.getComputedStyle(slide[0]).width.split("px")[0])) + "px";
        if(this.state.curSlideNum == -1){     // 0번째 슬라이드에서 왼쪽 버튼을 눌렀을 때 마지막 -2번째 슬라이드로 이동
          slideGroup.style.transition = "none";
          slideGroup.style.left = parseFloat(-(slide.length - 2) * parseFloat(window.getComputedStyle(slide[0]).width.split("px")[0])) + "px";
          this.setState({curSlideNum: slide.length - 3}, function(){
            slideGroup.style.left = parseFloat(-this.state.curSlideNum * parseFloat(window.getComputedStyle(slide[0]).width.split("px")[0])) + "px";
            slideGroup.style.transition = "all 1s";
          });
        }
        this.roofSlide(1);      // 타이머 재시작
      });
    } else if(direction == 1){
      this.setState({curSlideNum: this.state.curSlideNum + 1}, function(){
        slideGroup.style.left = parseFloat(-this.state.curSlideNum * parseFloat(window.getComputedStyle(slide[0]).width.split("px")[0])) + "px";
        if(this.state.curSlideNum == slide.length){
          slideGroup.style.transition = "none";   // 마지막 슬라이드에서 오른쪽 버튼을 눌렀을 때 2번째 슬라이드로 이동
          slideGroup.style.left = parseFloat(-1 * parseFloat(window.getComputedStyle(slide[0]).width.split("px")[0])) + "px";
          this.setState({curSlideNum: 2}, function(){
            slideGroup.style.left = parseFloat(-this.state.curSlideNum * parseFloat(window.getComputedStyle(slide[0]).width.split("px")[0])) + "px";
            slideGroup.style.transition = "all 1s";
          });
        }
        this.roofSlide(1);      // 타이머 재시작
      });
    }
  }

  roofSlide(direction){     // direction : -1은 왼쪽으로 계속 루프, 1은 오른쪽으로 계속 루프
    const intervalId = setInterval(()=>this.slideMove(direction), 10000);    // 타이머 10초로 설정
    this.setState({intervalId : intervalId});
  }
}

export default TeaserApp;
