import { combineReducers } from 'redux';
import settings from './settings/reducer';
import menu from './menu/reducer';
import authUser from './auth/reducer';
import patientsApp from './patients/reducer';
import surveyDetailApp from './surveyDetail/reducer';
import wardsApp from './wards/reducer';

const reducers = combineReducers({
  menu,
  settings,
  authUser,
  patientsApp,
  surveyDetailApp,
  wardsApp
});

export default reducers;