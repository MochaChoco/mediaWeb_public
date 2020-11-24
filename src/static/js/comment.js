import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Redux from './redux';
import css from '../css/comment.css';
import defaultProfileImage from '../image/icon/profile_thumb.png';
import likeIcon from '../image/icon/likeIcon.png';
import likedIcon from '../image/icon/likedIcon.png';

class CommentApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      movieInfo: null,
      description : '',
      firstCommentForm : null,
    }
    this.renderComment = this.renderComment.bind(this);
    this.manageButton = this.manageButton.bind(this);
    this.showForm = this.showForm.bind(this);
    this.hideForm = this.hideForm.bind(this);
    this.writeComment = this.writeComment.bind(this);
    this.updateComment = this.updateComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.checkComment = this.checkComment.bind(this);
    this.checkCommentVote = this.checkCommentVote.bind(this);
    this.voteComment = this.voteComment.bind(this);
    this.setBestComment = this.setBestComment.bind(this);
    this.moveToComment = this.moveToComment.bind(this);
    this.clearForm = this.clearForm.bind(this);
    this.pressEnter = this.pressEnter.bind(this);
    this.filterForm = this.filterForm.bind(this);
    this.showFirstButton = this.showFirstButton.bind(this);
    this.hideFirstButton = this.hideFirstButton.bind(this);
    this.dateStr = this.dateStr.bind(this);
    this.showCommentInfo = this.showCommentInfo.bind(this);
    this.createKeyPath = this.createKeyPath.bind(this);
    this.foldComment = this.foldComment.bind(this);
    this.foldAllComment = this.foldAllComment.bind(this);

    const { movieInfo } = this.props;
    this.state.movieInfo = movieInfo;
  }

  componentDidMount(){
    const userInfo = Redux.getState().userInfo;
    this.manageButton(userInfo);
    this.setState({firstCommentForm: document.getElementsByClassName("firstCommentForm")[0]});
    this.foldAllComment();
  }

  componentDidUpdate(){
    const set = Redux.getState().videoMenuSet;
    if(set.myCommentId != 0){
      const { foldComment } = this.props;
      foldComment();

      let target;
      const targetList = document.getElementsByClassName("commentWrapper");
      for(let i = 0; i < targetList.length ; i++){
        if(targetList[i].querySelector(":scope > .commentId").innerHTML == set.myCommentId && targetList[i].querySelector(".commentKeyPath") == undefined){
          target = targetList[i].querySelector(":scope > .commentId");
        }
      }
      this.moveToComment(target);
      set.myCommentId = 0;
      Redux.dispatch({type:'setVideoMenu', videoMenuSet:set});
    }
  }

  render() {
    let commentList = [], bestComment = [], addComment = [];
    if(this.state.movieInfo != null){
      commentList = this.renderComment(this.state.movieInfo._comment);
      bestComment = this.setBestComment();
    }
    if(Redux.getState().userInfo != null)
      addComment.push(
        <form className="commentInputUI firstCommentForm" method="post" type="write" key={Redux.getState().userInfo.name}>
          <img src={Redux.getState().userInfo != null && Redux.getState().userInfo.profileImage != '' ? Redux.getState().userInfo.profileImage : defaultProfileImage}></img>
          <textarea onKeyPress={this.pressEnter} onChange={this.filterForm} onClick={this.showFirstButton} placeholder="댓글 추가"></textarea>
          <div className="hideButton firstButton" onClick={()=>{this.clearForm(this.state.firstCommentForm); this.hideFirstButton()}}>취소</div>
          <div className="submitButton firstButton" onClick={()=>this.writeComment(this.state.firstCommentForm)}>완료</div>
        </form>
      );

    return (
      <div className="commentWrapper">
        <p className="commentId">0</p>
        {addComment}
        <div className="bestComment">
          {bestComment}
        </div>
        {commentList}
      </div>
    );
  }

  renderComment(comment){     // 댓글 정보 object를 참고하여 각각의 댓글들을 DOM으로 만듬
    let res = [];
    for(let i = 0 ; i < Object.values(comment).length ; i++){
      let reply = [], foldButton = [];
      reply.push(this.renderComment(Object.values(comment)[i].reply));

      if(reply != '')   // 자식 댓글이 있으면 펼치기 버튼 추가, 없으면 무시
        foldButton.push(<div className="foldButton" onClick={(e)=>this.foldComment(e.target)} key={Object.keys(comment)[i] + reply[0]}>접기</div>);
      if(Object.values(comment)[i].deletedDate == null){
        const movieVoteButton = this.checkCommentVote(Object.keys(comment)[i], Object.values(comment)[i].voteCount);
        const dateStr = this.dateStr(Object.values(comment)[i].writtenDate, Object.values(comment)[i].updatedDate);
        res.push(
          <div key={Object.keys(comment)[i]} className="commentWrapper">
            <p className="commentId">{Object.keys(comment)[i]}</p>
            <p className="commentVoteCount">{Object.values(comment)[i].voteCount}</p>
            <img className="commentProfileImage" src={Object.values(comment)[i].profileImage != '' ? Object.values(comment)[i].profileImage : defaultProfileImage}></img>
            <p className="commentUserId">{Object.values(comment)[i].name}</p>
            <p className="commentDate">{dateStr}</p>
            <p className="commentDescription">{Object.values(comment)[i].description}</p>
            {movieVoteButton}
            <div className="commentWriteButton" onClick={this.showForm}>답글</div>
            <div className="commentUpdateButton" onClick={this.showForm}>수정</div>
            <div className="commentDeleteButton" onClick={this.showForm}>삭제</div>
            {foldButton}
            <form className="commentInputUI" method="post">
              <img src={Redux.getState().userInfo != null && Redux.getState().userInfo.profileImage != '' ? Redux.getState().userInfo.profileImage : defaultProfileImage}></img>
              <textarea onKeyPress={this.pressEnter} onChange={this.filterForm} placeholder="답글 작성"></textarea>
              <div className="hideButton" onClick={this.hideForm}>취소</div>
              <div className="submitButton">완료</div>
            </form>
            {reply}
          </div>
        );
      } else{
        res.push(
          <div key={Object.keys(comment)[i]} className="commentWrapper">
            <p className="commentId">{Object.keys(comment)[i]}</p>
            <p>삭제 처리된 댓글입니다.</p>
            <div className="commentWriteButton" onClick={this.showForm}>답글</div>
            {foldButton}
            <form className="commentInputUI" method="post">
              <img src={Redux.getState().userInfo != null && Redux.getState().userInfo.profileImage != '' ? Redux.getState().userInfo.profileImage : defaultProfileImage}></img>
              <textarea onKeyPress={this.pressEnter} onChange={this.filterForm} placeholder="답글"></textarea>
              <div className="hideButton" onClick={this.hideForm}>취소</div>
              <div className="submitButton">완료</div>
            </form>
            {reply}
          </div>
        );
      }
    }
    return res;
  }

  manageButton(userInfo){   // 작성, 수정, 삭제 버튼의 숨김 처리 관리
    const comment = document.getElementsByClassName("commentWrapper");
    for(let i = 0 ; i < comment.length ; i++){
      if(userInfo != undefined){        // :scope는 범위 선택자로 해당 요소를 지닌 직계 자식이 있는지 등을 확인할 수 있다.
        if(comment[i].querySelector(":scope > .commentUserId") != null && comment[i].querySelector(":scope > .commentUserId").innerHTML != userInfo.name){
          comment[i].querySelector(":scope > .commentUpdateButton") != null ? comment[i].querySelector(":scope > .commentUpdateButton").style.display = 'none' : '';  // 유저 이름이 댓글 작성자와 일치하지 않으면 버튼을 숨김
          comment[i].querySelector(":scope > .commentDeleteButton") != null ? comment[i].querySelector(":scope > .commentDeleteButton").style.display = 'none' : '';
        }
      } else{    // 삭제된 댓글은 작성을 제외한 나머지 기능을 모두 막아놓는다.
        comment[i].querySelector(":scope > .commentWriteButton") != null ? comment[i].querySelector(":scope > .commentWriteButton").style.display = 'none' : '';
        comment[i].querySelector(":scope > .commentUpdateButton") != null ? comment[i].querySelector(":scope > .commentUpdateButton").style.display = 'none' : '';
        comment[i].querySelector(":scope > .commentDeleteButton") != null ? comment[i].querySelector(":scope > .commentDeleteButton").style.display = 'none' : '';
      }
    }
  }

  showForm(e){   // 작성, 수정, 삭제 버튼을 눌렀을때 처리
    const commentUI = e.target.parentNode.querySelector('.commentInputUI');
    const writeComment = this.writeComment;
    const updateComment = this.updateComment;
    const deleteComment = this.deleteComment;
    const buttonClassName = e.target.className;
    commentUI.style.margin = "0 0 2.5rem 4.5rem";

    switch (buttonClassName) {
      case 'commentWriteButton':
        commentUI.querySelector('textarea').value = '';
        commentUI.setAttribute('type', 'write');
        commentUI.querySelector('.submitButton').onclick = function(){ writeComment(commentUI) };
        break;
      case 'commentUpdateButton':
        commentUI.querySelector('textarea').value = commentUI.parentNode.querySelector('.commentDescription').innerHTML;
        commentUI.setAttribute('type', 'update');
        commentUI.querySelector('.submitButton').onclick = function(){ updateComment(commentUI) };
        break;
      case 'commentDeleteButton':
        deleteComment(commentUI);
        return;   // 댓글 작성창이 열리지 않도록 설정
      default:
    }
    commentUI.style.display = 'block';
  }

  hideForm(e){    // 폼 숨길때 처리
    const commentUI = e.target.parentNode;
    commentUI.querySelector('textarea').value = '';
    commentUI.style.display = 'none';
    commentUI.style.margin = 0;
  }

  writeComment(form){
    let curMovieUrl = window.location.href.split("=");
    const target = event.target;
    const { movieInfo } = this.state;
    const { setCommentInfo } = this.props;    // 댓글의 전체 갯수 업데이트 용도로 사용
    const keyPath = this.createKeyPath(form.parentNode, []);     // 현재 div까지의 경로
    const post = {};

    post.userName = Redux.getState().userInfo.name;
    post.userEmail = Redux.getState().userInfo.email;
    post.userProfileImage = Redux.getState().userInfo.profileImage;
    post.keyPath = keyPath;
    post.description = form.querySelector('textarea').value;
    post.movieId = curMovieUrl[1];
    post.movieName = movieInfo._title;
    post.fileUrl = movieInfo._fileUrl;

    if(!this.checkComment(post.description))
      return;

    fetch('/api/watch/writeComment',{
        method :"PATCH",
        headers:{
          'content-type':'application/json'
        },
        body:JSON.stringify(post),
        credentials: 'include'
    }).then(res=>res.json())
        .then(data=>{
          if(!form.classList.contains('firstCommentForm'))      // firstCommentForm인지 확인
            form.style.display = "none";    // 작성 폼 다시 숨김처리
          this.clearForm(form);     // 텍스트 내용 비움
          if(data){
            console.log("댓글 작성 성공");
            this.setState({movieInfo: data.movieInfo});
            Redux.dispatch({type:'setUserInfo', userInfo: data.userInfo});
            setCommentInfo(data.movieInfo);

            if(!form.classList.contains("firstCommentForm")){     // 답글이 아닌 댓글을 달았는지 확인
              const childComment = form.parentNode.querySelectorAll(':scope > .commentWrapper');
              for(let i = 0 ; i < childComment.length ; i++){
                childComment[i].style.display = "none";  // 답글인지 확인 후 숨김 처리
              }
              this.foldComment(form.parentNode.querySelector(":scope > .foldButton"));    // 댓글이 닫혀있다면 펼친다
            }

            if(target.parentNode.classList.contains("firstCommentForm"))    // 답글이 아닌 댓글을 작성한거면 버튼을 수동으로 숨김처리해줌
              this.hideFirstButton();
          } else{
            alert("잘못된 로그인 정보입니다.");
            console.log("잘못된 로그인 정보");
          }
        });
  }

  updateComment(form){    // 댓글 수정 처리
    let curMovieUrl = window.location.href.split("=");
    const { movieInfo } = this.state;
    const keyPath = this.createKeyPath(form.parentNode, []);     // 현재 div까지의 경로
    const post = {};

    post.writer = form.parentNode.querySelector('.commentUserId').innerHTML;
    post.userName = Redux.getState().userInfo.name;
    post.userEmail = Redux.getState().userInfo.email;
    post.userProfileImage = Redux.getState().userInfo.profileImage;
    post.keyPath = keyPath;
    post.description = form.querySelector('textarea').value;
    post.movieId = curMovieUrl[1];
    post.commentId = form.parentNode.querySelector('.commentId').innerHTML;

    if(!this.checkComment(post.description))
      return;

    fetch('/api/watch/updateComment',{
        method :"PATCH",
        headers:{
          'content-type':'application/json'
        },
        body:JSON.stringify(post),
        credentials: 'include'
    }).then(res=>res.json())
        .then(data=>{
          form.style.display = "none";    // 작성 폼 다시 숨김처리
          this.clearForm(form);       // 텍스트 내용 비움
          if(data){
            console.log("댓글 수정 성공");
            this.setState({movieInfo: data.movieInfo});
            Redux.dispatch({type:'setUserInfo', userInfo: data.userInfo});
          } else{
            alert("잘못된 로그인 정보입니다.");
            console.log("잘못된 로그인 정보");
          }
        });
  }

  deleteComment(form){    // 댓글 삭제 처리
    let curMovieUrl = window.location.href.split("=");
    const { movieInfo } = this.state;
    const keyPath = this.createKeyPath(form.parentNode, []);     // 현재 div까지의 경로
    const post = {};

    post.writer = form.parentNode.querySelector('.commentUserId').innerHTML;
    post.userName = Redux.getState().userInfo.name;
    post.userEmail = Redux.getState().userInfo.email;
    post.keyPath = keyPath;
    post.movieId = curMovieUrl[1];
    post.commentId = form.parentNode.querySelector('.commentId').innerHTML;

    fetch('/api/watch/deleteComment',{
        method :"PATCH",
        headers:{
          'content-type':'application/json'
        },
        body:JSON.stringify(post),
        credentials: 'include'
    }).then(res=>res.json())
        .then(data=>{
          if(data){
            console.log("댓글 삭제 성공");
            this.setState({movieInfo: data.movieInfo});
            Redux.dispatch({type:'setUserInfo', userInfo: data.userInfo});
          }
          else{
            alert("잘못된 로그인 정보입니다.");
            console.log("잘못된 로그인 정보");
          }
        });
  }

  checkComment(description){    // form을 제출할 때 특수 문자, 문자 개수 등을 체크
    const regText = /^[^\`|^'|^"|^<|^>]+$/;       // '나 \`등 쿼리에 영향 줄 수 있는 특수 문자가 있는지 체크;
    if(description.length == 0){
      alert("내용을 작성해야 합니다.");
      return false;
    }

    if(!regText.test(description)){
      alert("사용할 수 없는 특수 문자가 있습니다. [Forbidden characters : ' ,` ,\", <, >]");
      return false;
    }
    return true;
  }

  checkCommentVote(id, count){      // 좋아요 여부 체크
    let curMovieUrl = window.location.href.split("=");
    curMovieUrl = curMovieUrl[1];
    const userInfo = Redux.getState().userInfo;
    let voteButton = [];
    if(userInfo != null && userInfo.myCommentVote != undefined){
      const vote = userInfo.myCommentVote;
      for(let i = 0 ; i < Object.keys(vote).length ; i++){
        if(Object.keys(vote)[i] == curMovieUrl){      // db에서 유저가 해당 영화에 댓글 달았던 적이 있는지 판단
          for(let j = 0 ; j < Object.values(vote)[i].length ; j++){
            let commentId = Object.values(vote)[i][j];
            commentId = commentId.split(".")[commentId.split(".").length - 1];      // db에서 댓글 id 추출
            if(commentId == id){    // 좋아요 취소
              voteButton.push(<div className="commentVoteButton commentVoteDone" key={id}><img src={likedIcon} onClick={this.voteComment}/> <p onClick={(e)=>this.voteComment(e, keyPath)}>{count}</p></div>);
              return voteButton;
            }
          }
        }
      }
      voteButton.push(  // 좋아요
      <div className="commentVoteButton" key={id}><img src={likeIcon} onClick={this.voteComment}/> <p>{count}</p></div>
      );
    }

    return voteButton;
  }

  voteComment(e){   // 댓글 좋아요 처리
    const form = e.target.parentNode.parentNode.querySelector('.commentInputUI');
    const { movieInfo } = this.state;
    const userInfo = Redux.getState().userInfo;
    const path = e.target.parentNode.parentNode.querySelector('.commentKeyPath');
    let keyPath = [];     // 현재 div까지의 경로

    if(!path){     // 일반 댓글 좋아요 수 갱신할 때
      let parentTarget = form.parentNode;
      if(form.parentNode.querySelector('.commentId').innerHTML != 0)
        keyPath.push(form.parentNode.querySelector('.commentId').innerHTML);

      while(true){
      if(parentTarget.parentNode.className != 'commentWrapper')
        break;
        parentTarget = parentTarget.parentNode;
        if(parentTarget.querySelector('.commentId').innerHTML != 0)
          keyPath.push(parentTarget.querySelector('.commentId').innerHTML);
      }
    } else{     // 베스트 댓글 좋아요 수 갱신할 때
      let temp = path.innerHTML.split(",");
      for(let i = 0 ; i < temp.length ; i++)
        keyPath.push(temp[i]);
    }

    const post = {};
    let curMovieUrl = window.location.href.split("=");
    post.userEmail = userInfo.email;
    post.keyPath = keyPath;
    post.movieId = curMovieUrl[1];
    post.commentId = keyPath[0];

    fetch('/api/watch/manageCommentVote',{
        method :"PATCH",
        headers:{
          'content-type':'application/json'
        },
        body:JSON.stringify(post),
        credentials: 'include'
    }).then(res=>res.json())
        .then(data=>{
          if(data){
            console.log("댓글 좋아요 갱신 성공");
            Redux.dispatch({type:'setUserInfo', userInfo: data.userInfo});
            this.setState({movieInfo: data.movieInfo});
          }
          else{
            alert("댓글 좋아요 갱신 실패");
            console.log("잘못된 로그인 정보");
          }
        });
  }

  setBestComment(){       // 좋아요 수가 일정 이상되면 bestComment로 선정
    const standard = 5;   // 몇개 이상 좋아요 수를 받아야 best 댓글이 될지를 기준
    const movieInfo = this.state.movieInfo;
    let bestComment = [], commentInfo = [];
    commentInfo = this.showCommentInfo(movieInfo._comment, '');
    if(commentInfo.length > 1){
      let temp = [];
      for(let i = 0 ; i < commentInfo.length ; i++){
        if(commentInfo[i].deletedDate == null)    // 삭제 처리되지 않은 댓글만 temp에 push
          temp.push(commentInfo[i]);
      }
      if(temp.length > 0){
        temp = temp.sort(
          function(a, b){           // 영화 목록을 좋아요 수가 많은 순으로 정렬(내림차순)
            return b.voteCount - a.voteCount;
        });

        if(temp[0].voteCount >= standard){     // 가장 많이 받은 추천수가 standard 변수보다 적으면 함수 종료
          const movieVoteButton = this.checkCommentVote(temp[0].id, temp[0].voteCount);
          const dateStr = this.dateStr(temp[0].writtenDate, temp[0].updatedDate);
          bestComment.push(
            <div className="commentWrapper" key={temp[0].id}>
              <h1>베스트 댓글</h1>
              <p className="commentId">{temp[0].id}</p>
              <p className="commentVoteCount">{temp[0].voteCount}</p>
              <p className="commentKeyPath">{temp[0].path}</p>
              <img className="commentProfileImage" src={temp[0].profileImage != '' ? temp[0].profileImage : defaultProfileImage }></img>
              <p className="commentUserId">{temp[0].name}</p>
              <p className="commentDate">{dateStr}</p>
              <p className="commentDescription">{temp[0].description}</p>
              {movieVoteButton}
              <div className="commentWriteButton" onClick={(e)=>this.moveToComment(e.target)}>댓글로 이동</div>
            </div>);
        }
      }
    }
    return bestComment;
  }

  moveToComment(dom){     // 해당 댓글로 scroll 이동 처리
    const id = dom.parentNode.querySelector(".commentId").innerHTML;
    const idGroup = document.getElementsByClassName("commentId");
    let target, keyPath;
    if(dom.parentNode.querySelector(".commentKeyPath") == undefined){
      keyPath = this.createKeyPath(dom.parentNode, []);
    }
    else {
      keyPath = dom.parentNode.querySelector(".commentKeyPath").innerHTML;
    }

    for(let i = 0 ; i < idGroup.length ; i++){           // 베스트 댓글이 중복 검색되는 것을 방지
      if(idGroup[i].parentNode.parentNode.className != "bestComment"){
        if(idGroup[i].innerHTML == id){
          target = idGroup[i];
        }
        for(let j = 1 ; j < keyPath.length ; j++){      // 타겟이 되는 댓글은 열지 않고, 나머지 경로에 있는 댓글만 연다.
          if(idGroup[i].innerHTML == keyPath[j]){
            idGroup[i].parentNode.querySelector(":scope > .commentWrapper").style.display = "none";  // 닫혀있으면 열고 이동
            this.foldComment(idGroup[i].parentNode.querySelector(":scope > .foldButton"));
            break;
          }
        }
      }
    }
    target.parentNode.scrollIntoView({ behavior: 'smooth', block: 'start'});    // 해당 댓글을 상단으로 표시하되, 부드럽게 이동함
  }

  clearForm(form){    // 폼의 값을 비운다.
    const textArea = form.querySelector(':scope > textarea');
    textArea.value = '';
  }

  pressEnter(e){            // 엔터키 누르면 댓글 달리도록 설정
    if(e.key == 'Enter'){
      e.preventDefault();
      if(e.target.parentNode.getAttribute('type') == 'write')
        this.writeComment(e.target.parentNode);
      else if(e.target.parentNode.getAttribute('type') == 'update')
        this.updateComment(e.target.parentNode);
    }
  }

  filterForm(e){
  }

  showFirstButton(e){     // 댓글보기 상단에 댓글 입력창 클릭했을 때 처리
    e.stopPropagation();
    const button = document.getElementsByClassName('firstCommentForm')[0].querySelectorAll('div');
    for(let i = 0 ; i < button.length ; i++){
      button[i].classList.remove("firstButton");
    }
  }

  hideFirstButton(){     // 댓글보기 상단에 댓글 입력창 클릭 취소했을 때 처리
    const button = document.getElementsByClassName('firstCommentForm')[0].querySelectorAll('div');
    for(let i = 0 ; i < button.length ; i++){
      button[i].classList.add("firstButton");
    }
  }

  dateStr(date, updateDate){    // 댓글의 작성 시간을 대략적으로 표시하는 함수
    const curDate = new Date();
    const writtenDate = new Date(date);

    let result = Math.abs(curDate.getFullYear() - writtenDate.getFullYear());
    if(result == 0){
      result = Math.abs((curDate.getMonth() - 1) - (writtenDate.getMonth() - 1));
      if(result == 0){
        result = Math.abs(curDate.getDate() - writtenDate.getDate());
        if(result == 0){
          result = Math.abs(curDate.getHours() - writtenDate.getHours());
          if(result == 0){
            result = Math.abs(curDate.getMinutes() - writtenDate.getMinutes());
            if(result == 0){
              result = "방금 전" + (updateDate != null ? "(수정됨)" : "");
              return result;
            }
            result = result + "분 전" + (updateDate != null ? "(수정됨)" : "");
            return result;
          }
          result = result + "시간 전" + (updateDate != null ? "(수정됨)" : "");
          return result;
        }
        result = result + "일 전" + (updateDate != null ? "(수정됨)" : "");
        return result;
      }
      result = result + "달 전" + (updateDate != null ? "(수정됨)" : "");
      return result;
    }
    result = result + "년 전" + (updateDate != null ? "(수정됨)" : "");
    return result;
  }

  showCommentInfo(comment, path) {    // 재귀함수를 이용하여 베스트 댓글의 keyPath를 생성
    let info = [];
    for(let i = 0 ; i < Object.keys(comment).length ; i++){
      if(Object.keys(Object.values(comment)[i].reply).length > 0){
        let res = [];
        res = this.showCommentInfo(Object.values(comment)[i].reply, path);
        for(let j = 0 ; j < res.length ; j++){
          res[j].path += "," + Object.keys(comment)[i];
          info.push(res[j]);
        }
      }
      path += Object.keys(comment)[i];

      const post = {
        id : Object.keys(comment)[i],
        name : Object.values(comment)[i].name,
        description : Object.values(comment)[i].description,
        profileImage : Object.values(comment)[i].profileImage,
        voteCount : Object.values(comment)[i].voteCount,
        writtenDate: Object.values(comment)[i].writtenDate,
        updatedDate : Object.values(comment)[i].updatedDate,
        deletedDate : Object.values(comment)[i].deletedDate,
        path: path
      };
      info.push(post);
      path = '';
    }
    return info;
  }

  createKeyPath(target, keyPath){   // 댓글의 경로를 생성하는 함수
    if(target.querySelector('.commentId').innerHTML != 0){
      keyPath.push(target.querySelector('.commentId').innerHTML);
      if(target.parentNode.classList.contains('commentWrapper') && target.parentNode.querySelector('.commentId').innerHTML != 0){
        let res = this.createKeyPath(target.parentNode, keyPath);
        keyPath.push(res.pop());
      }
    }
    return keyPath;
  }

  foldComment(target){   // 댓글 펼치고 접는 함수
    let childComment = target.parentNode.querySelectorAll(':scope > .commentWrapper');
    let str;
    if(window.getComputedStyle(childComment[0]).display != "none"){
      str = "none";
      target.innerHTML = "펼치기";
    } else{
      str = "block";
      target.innerHTML = "접기";
    }
    for(let i = 0 ; i < childComment.length ; i++){
      childComment[i].style.display = str;
    }
  }

  foldAllComment(){     // 맨 처음 댓글이 모두 로딩되면 모든 댓글을 접는다.
    const foldButton = document.getElementsByClassName("foldButton");
    for(let i = 0 ; i < foldButton.length ; i++){
      this.foldComment(foldButton[i]);
    }
  }
}

export default CommentApp;
