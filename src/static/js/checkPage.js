import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import Cookies from 'js-cookie';

    // 현재 로그인 되어있는지 파악하는 함수 (현재 있는 쿠키에서 임시로 로그인 여부를 판단한다.)
  function firstCheckAuth(){
    if((Cookies.get('name') == undefined)){      // 페이지에 들어왔는데 쿠키가 없을 때
      return false;
    } else
      return true;
  }
    // component: Component, rest Object {path: ..., accessibleLoginStatus: ..., func: ...} 으로 분해됨
  const AuthCheckRoute = ({component:Component, ...rest})=>{
    return(
      <Route {...rest} render={(props=>{
        let isLogined = firstCheckAuth();     // 현재 페이지의 접속 권한과 로그인 상태가 일치하는지 확인
        let isAccessible = (isLogined == rest.accessibleLoginStatus || rest.accessibleLoginStatus == null ? true : false);
        return isAccessible == true ? <Component {...rest}/> :
        <Redirect to="/index/1" />
      })}></Route>
    )
  }

  export default AuthCheckRoute;
