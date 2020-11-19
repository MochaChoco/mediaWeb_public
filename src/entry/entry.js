import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, matchPath } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';
import Redux from '../static/js/redux';
import Main from '../static/js/main';

console.log(process.env.NODE_ENV);

const render = () => {
  ReactDOM.render(
    <React.StrictMode>
      <Router>
        <Route path="*">
          <Main />
        </Route>
      </Router>
    </React.StrictMode>,
    document.getElementById('root')
  );
}
serviceWorker.unregister();

Redux.subscribe(render);
render();
