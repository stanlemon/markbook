require("babel-polyfill");

const React = require('react');
const ReactDOM = require('react-dom');
const querystring = require('querystring');
const App = require('./components/App');

const { directory } = querystring.parse(window.location.search.substring(1));

ReactDOM.render(
    <App directory={directory} />,
    document.getElementById('root')
);
