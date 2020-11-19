import { composeWithDevTools } from 'redux-devtools-extension';
import { createStore } from 'redux';

function reducer(state, action){
  if(state == undefined){
    return {
      curPage: null,          // 현재 페이지 이름
      isLogined: false,       // 로그인 여부
      movieInfo: null,        // 영화 정보 object
      userInfo: null,         // 유저 정보 object
      videoMenuSet: null,     // 비디오 플레이어 메뉴 정보 object
    }
  }

  var newState;
  if(action.type == 'setCurPage'){        // 현재 페이지 이름 저장
    newState = Object.assign({}, state, {curPage : action.pageName});
  }      // Object assign 함수는 첫번째 인자에 두번째 인자, 세번째 인자를 바탕으로 생성한 값을 복사한다.
  if(action.type == 'setIsLogin'){        // 로그인 여부 저장
    newState = Object.assign({}, state, {isLogined : action.isLogined});
  }
  else if(action.type == 'setUserInfo'){      // 유저 정보 object 저장
    newState = Object.assign({}, state, {userInfo : action.userInfo});
  }
  else if(action.type == 'setMovieInfo'){     // 영화 정보 object 저장
    newState = Object.assign({}, state, {movieInfo : action.movieInfo});
  }
  else if(action.type == 'updateViewingCount'){   // 영화 정보 object에서 viewingCount만 갱신
    var info = state.movieInfo;
    info[action.index]._viewingCount += 1;
    newState = Object.assign({}, state, {movieInfo : info});
  }
  else if(action.type == 'setProfileImage'){      // 유저 정보 object에서 프로필 사진 정보 변경
    var info = state.userInfo;
    info.profileImage = action.profileImage;
    newState = Object.assign({}, state, {userInfo : info});
  }
  else if(action.type == 'setVideoMenu'){       // video 메뉴 설정
    newState = Object.assign({}, state, {videoMenuSet : action.videoMenuSet});
  }
  return newState;
}

let devTools = composeWithDevTools();
let store = createStore(reducer, devTools);

export default store;
