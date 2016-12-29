import { SET_DIRECTORY } from '../actions';

const defaultState = {};

module.exports = (state = defaultState, action) => {
    switch (action.type) {
        case SET_DIRECTORY:
            return Object.assign({}, state, { directory: action.directory });
    }
    return state;
};
