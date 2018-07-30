import request from 'axios';

import {urlPrefix} from './config';

const authToken = 'x-auth-token';
let currentAuthToken = localStorage.getItem(authToken);

request.interceptors.request.use(config => {
  if (!config.timeout) {
    config.timeout = 10 * 1000;
  }
  if (currentAuthToken) {
    config.headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  config.url = `${urlPrefix}${config.url}`;
  return config;
});

request.interceptors.response.use(response => {
  const v = response.headers[authToken];
  if (v && v !== currentAuthToken) {
    localStorage.setItem(authToken, v);
    currentAuthToken = v;
  }
  return response;
});
