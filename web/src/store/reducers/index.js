import { combineReducers } from 'redux';

import menu from './menu';
import user from './user';

const reducers = combineReducers({ menu, user });

export default reducers;
