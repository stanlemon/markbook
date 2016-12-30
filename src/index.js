const React = require('react');
const ReactDOM = require('react-dom');
const querystring = require('querystring');
const { createStore, bindActionCreators } = require('redux');
const { Provider, connect } = require('react-redux');

const actions = require('./actions');
const reducer = require('./reducer');

const store = createStore(reducer);

const { directory } = querystring.parse(window.location.search.substring(1));

const App = require('./components/App');

// There is probably a better way of doing this...
App.defaultProps = {
    directory
};

const Root = connect(state => state, dispatch => {
    return { actions: bindActionCreators(actions, dispatch) };
})(App);

ReactDOM.render(
    <Provider store={store}>
        <Root />
    </Provider>,
    document.getElementById('root')
);
