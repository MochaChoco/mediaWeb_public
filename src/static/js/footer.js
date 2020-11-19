import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import css from '../css/footer.css';

class FooterApp extends Component {
  render() {
    return (
      <footer>
        <div id="footerWrapper">
          <ul id="footerMenu">
            <li><Link to='/'><p>이용 약관</p></Link></li>
            <li><Link to='/'><p>개인정보 처리방침</p></Link></li>
          </ul>
        </div>
      </footer>
    );
  }
}

export default FooterApp;
