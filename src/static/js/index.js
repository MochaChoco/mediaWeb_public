import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Redux from './redux';
import Teaser from './teaser.js'
import MovieSlide from './movieSlide.js'

class IndexApp extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    Redux.dispatch({type:'setCurPage', pageName: 'index'});
    const { showUpperIcon } = this.props;
    showUpperIcon();
  }

  render() {
    const { checkPiP } = this.props;
    const movieInfo = Redux.getState().movieInfo;

    return (
      <div id="contentWrapper">
        <div id="content">
          <Teaser movieInfo={movieInfo} checkPiP={checkPiP}/>
          <MovieSlide movieInfo={movieInfo} checkPiP={checkPiP} title={'인기 영화 트레일러 Top 5'} tag={'hot'}/>
          <MovieSlide movieInfo={movieInfo} checkPiP={checkPiP} title={'신규 영화 트레일러'} tag={'new'}/>
          <MovieSlide movieInfo={movieInfo} checkPiP={checkPiP} title={'액션'} tag={'action'}/>
          <MovieSlide movieInfo={movieInfo} checkPiP={checkPiP} title={'판타지'} tag={'fantasy'}/>
          <MovieSlide movieInfo={movieInfo} checkPiP={checkPiP} title={'코메디'} tag={'comedy'}/>
          <MovieSlide movieInfo={movieInfo} checkPiP={checkPiP} title={'SF'} tag={'SF'}/>
        </div>
      </div>
    );
  }
}

export default IndexApp;
