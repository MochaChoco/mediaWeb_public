import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Redux from './redux';
import css from '../css/searchResult.css';
import queryString from 'query-string';

class SearchResultApp extends Component {
  constructor(props) {
    super(props);
    this.showSearchResult = this.showSearchResult.bind(this);
  }

  componentDidMount() {
    Redux.dispatch({type:'setCurPage', pageName: 'searchResult'});
    const { showUpperIcon } = this.props;
    showUpperIcon();
  }

  render() {
    let curId = window.location.href.split("=");
    const keyword = curId[1];   // 주소창에서 유저가 검색한 키워드를 따옴
    const searchResult = this.showSearchResult(decodeURIComponent(keyword));
    let arrayToComponent = [];

    if(searchResult!= undefined){
      for(let i = 0 ; i < searchResult.length ; i++){
        arrayToComponent.push(
          <div className="movieWrapper mySearch" key={i}>
              <Link to= {`${'/watch=' + searchResult[i]._id}`} className="movieLink">
                <img src={searchResult[i]._fileUrl + searchResult[i]._thumbnailUrl} className="movieClip" draggable="false"></img>
              </Link>
          </div>
        )
      }
    }

    return (
      <div id="contentWrapper">
        <div id="mySearchWrapper">
          <h1>
            검색 결과 {keyword ? `: ${decodeURIComponent(keyword)}` : ''}
          </h1>
          <div id="searchWrapper">
            {arrayToComponent.length != 0 ? arrayToComponent : <h2 id="noSearchWarning">검색 결과가 없습니다.</h2>}
          </div>
        </div>
      </div>
    );
  }

  showSearchResult(keyword){          // 검색 결과 출력 함수
    const { movieInfo } = this.props;
    if(movieInfo != null && keyword != undefined){
      let result = [];                                // search 함수는 문자열 안에 해당 키워드가 있는지 검사함
      for(let i = 0 ; i < movieInfo.length ; i++){    // new RegExp(keyword, 'i')은 대소문자 구분 없이 검색하도록 설정하기 위함임
        if(movieInfo[i]._title.search(new RegExp(keyword, 'i')) != -1){       // 제목 검색
          result.push(movieInfo[i]);
          continue;
        }
        for(let j = 0 ; j < Object.values(movieInfo[i]._info._actor).length ; j++){   // 배우 검색
          if(Object.values(movieInfo[i]._info._actor)[j].search(new RegExp(keyword, 'i')) != -1){
            result.push(movieInfo[i]);
            break;
          }
          continue;
        }
        for(let j = 0 ; j < Object.values(movieInfo[i]._tag).length ; j++){   // 장르 검색
          if(Object.values(movieInfo[i]._tag)[j].search(new RegExp(keyword, 'i')) != -1){
            result.push(movieInfo[i]);
            break;
          }
        }
      }
      return result;
    }
  }
}

export default SearchResultApp;
