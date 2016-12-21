const React = require('react');
const ReactDOM = require('react-dom');

const { createStore, bindActionCreators } = require('redux');
const { Provider, connect } = require('react-redux');

const actions = require('./actions');
const reducer = require('./reducer/');

const store = createStore(reducer);

const App = require('./components/App');

const Root = connect(state => state, dispatch => {
    return { actions: bindActionCreators(actions, dispatch) };
})(App);

ReactDOM.render(
    <Provider store={store}>
        <Root />
    </Provider>,
    document.getElementById('root')
);
