import React from 'react';
import ReactDOM from 'react-dom';
import Main from './main';
import '../../helpers/handlebars-helpers';

window.sonarqube.appStarted.then(options => {
  var el = document.querySelector(options.el);
  ReactDOM.render(<Main topQualifiers={options.rootQualifiers}/>, el);
});
