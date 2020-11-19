import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import css from '../css/movieSlide.css';

class MovieSlideApp extends Component {  constructor(props) {
    super(props);
    this.state ={
      isClicked : false,
      direction : -1,
      leftArrowStatus: "none",
      rightArrowStatus: "block"
    }
    this.myRef = React.createRef();
    this.renderMovieLink = this.renderMovieLink.bind(this);
    this.setSlideListWidth = this.setSlideListWidth.bind(this);
    this.moveSlideList = this.moveSlideList.bind(this);
    this.resetSlidePos = this.resetSlidePos.bind(this);
    this.setArrowVisible = this.setArrowVisible.bind(this);
  }

  componentDidMount() {
    window.addEventListener("resize", this.setSlideListWidth);
    window.addEventListener("resize", this.resetSlidePos);
  }

  componentWillUnmount(){
    window.removeEventListener("resize", this.setSlideListWidth);
    window.removeEventListener("resize", this.resetSlidePos);
  }

  componentDidUpdate(){
    const slideList = this.myRef.current;
    this.setArrowVisible(slideList);
  }

  render() {
    let arrayToMovieLink = [];
    const { movieInfo, checkPiP, title, tag } = this.props;
    if(movieInfo != null){
      this.renderMovieLink(arrayToMovieLink, movieInfo, tag, checkPiP);
      this.setSlideListWidth();
    }

    return (
      <div className="movieCategory">
        <h1>{title}</h1>
          <div className="slideLeftArrow" onClick={(e)=>this.moveSlideList(e, -1)}>&#10094;</div>
        <div ref={this.myRef} className="movieListSlide" onLoad={()=>{this.setState({isLoaded: true})}}>
          {arrayToMovieLink}
        </div>
        <div className="slideRightArrow" onClick={(e)=>this.moveSlideList(e, 1)}>&#10095;</div>
      </div>
    );
  }

  renderMovieLink(arrayToMovieLink, movieInfo, tag, checkPiP){          // 영화 slide를 그리는 함수
    if(movieInfo!= undefined){
      for(let i = 0 ; i < movieInfo.length ; i++){
        for(let j = 0 ; j < movieInfo[i]._tag.length ; j++){
          if(movieInfo[i]._tag[j] == tag){        // 해당 영화의 태그가 일치하면 dom 생성
            arrayToMovieLink.push(
              <div className="movieWrapper" key={i}>
                  <Link to= {`${'/watch=' + movieInfo[i]._id}`} className="movieLink" onClick={()=>checkPiP(movieInfo[i]._fileUrl)} num={i}>
                    <img src={movieInfo[i]._fileUrl + movieInfo[i]._thumbnailUrl} className="movieClip" draggable="false"></img>
                  </Link>
              </div>);
            break;
          }
        }
      }
    }
  }

  setSlideListWidth(){          // 영화 slide 수는 유동적이므로 그에 맞게 group의 width를 설정해줌
    const slideList = this.myRef.current;
    if(slideList != null && slideList.childElementCount > 0)
      slideList.style.width = slideList.querySelectorAll(":scope > .movieWrapper").length * (window.getComputedStyle(slideList.querySelector(':scope > .movieWrapper')).width).split("px")[0] + "px";
  }

  moveSlideList(e, direction){        // 버튼을 눌렀을 때 slide 동작을 처리하는 함수
    if(!this.state.isClicked){    // 버튼을 중복 클릭하는 것을 방지
      const slideList = this.myRef.current;
      const slideLeft = parseFloat(window.getComputedStyle(slideList).left.split("px")[0]);
      const movieWrapper = slideList.querySelector('.movieWrapper');
      const movieWrapperWidth = parseFloat(window.getComputedStyle(movieWrapper).width.split("px")[0]);
      const thisFunc = this;
      let pos = 0, maxPos;
      let maxshown = Math.floor((window.innerWidth - 20) / movieWrapperWidth);    // 한 화면에 들어갈 수 있는 movieWrapper 개수
            // slide의 총 길이 - (movieWrapper의 개수 % 한 화면에 들어갈 수 있는 movieWrapper의 개수) * movieWrapper의 너비

      if(slideList.querySelectorAll('.movieWrapper').length % Math.floor((window.innerWidth - 20) / movieWrapperWidth) == 0)
        maxPos = parseFloat(window.getComputedStyle(slideList).width.split("px")[0]) - maxshown * movieWrapperWidth;
      else
        maxPos = parseFloat(window.getComputedStyle(slideList).width.split("px")[0]) - (slideList.querySelectorAll('.movieWrapper').length % maxshown * movieWrapperWidth);

      this.setState({leftArrowStatus: "block", rightArrowStatus: "block"});
      slideList.parentNode.querySelector(".slideRightArrow").style.display = "block";
      slideList.parentNode.querySelector(".slideLeftArrow").style.display = "block";

      if(direction == -1){    // 왼쪽 버튼을 눌렀으면
        pos = -Math.ceil((window.innerWidth - 20) / movieWrapperWidth);
        if(slideLeft + direction * pos * movieWrapperWidth < 0)
          slideList.style.left = slideLeft + direction * pos * movieWrapperWidth + "px";
        else{
          thisFunc.setState({leftArrowStatus: "none"});
          slideList.parentNode.querySelector(".slideLeftArrow").style.display = "none";
          slideList.style.left = "0px";
        }
      } else if(direction == 1){    // 오른쪽 버튼을 눌렀으면
        pos = -Math.floor((window.innerWidth - 20) / movieWrapperWidth);
        if(slideLeft + direction * pos * movieWrapperWidth > -maxPos)
          slideList.style.left = slideLeft + direction * pos * movieWrapperWidth + "px";
        else{
          thisFunc.setState({rightArrowStatus: "none"});
          slideList.parentNode.querySelector(".slideRightArrow").style.display = "none";
          slideList.style.left = -maxPos + "px";
        }
      }

      this.setState({isClicked: true, direction: direction});
      setTimeout(function(){      // 중복 클릭 방지하는 타이머
        thisFunc.setState({isClicked: false});
      }, 500);
    }
  }

  resetSlidePos(){          // slide를 초기화시켜주는 함수
    const slideList = this.myRef.current;
    slideList.style.left = "0px";
    this.setState({leftArrowStatus: "none", rightArrowStatus: "block"});
    slideList.parentNode.querySelector(".slideLeftArrow").style.display = "none";
    slideList.parentNode.querySelector(".slideRightArrow").style.display = "block";
    this.setArrowVisible(slideList);
  }

  setArrowVisible(slideList){         // slide가 왼쪽 또는 오른쪽 끝까지 이동했을 때 좌우 버튼 숨기기 처리
    const movieWrapper = document.getElementsByClassName("movieWrapper")[0];
    const maxWidth = window.innerWidth - 20;
    if(parseFloat(window.getComputedStyle(slideList).width.split("px")[0]) < maxWidth){
      slideList.parentNode.querySelector(".slideLeftArrow").style.display = "none";
      slideList.parentNode.querySelector(".slideRightArrow").style.display = "none";
    } else{
      slideList.parentNode.querySelector(".slideLeftArrow").style.display = this.state.leftArrowStatus;
      slideList.parentNode.querySelector(".slideRightArrow").style.display = this.state.rightArrowStatus;
    }
  }
}

export default MovieSlideApp;
