/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/
(function() {
  'use strict';

  class StorageServer {

    constructor($resource, $window, $q, $stateParams, bbpConfig, storageServerTokenManager) {
      this.$resource = $resource;
      this.$window = $window;
      this.$q = $q;
      this.$stateParams = $stateParams;
      this.storageServerTokenManager = storageServerTokenManager;

      this.CLIENT_ID = bbpConfig.get('auth.clientId');
      this.PROXY_URL = bbpConfig.get('api.proxy.url');
      this.BASE_URL = `${this.PROXY_URL}/storage`;

      this.buildStorageResource();

    }

    buildStorageResource() {
      let buildAction = action => angular.merge(action, {
        headers: { 'Context-Id': () => this.$stateParams.ctx },
        interceptor: { responseError: err => this.onError(err) }
      });

      this.proxyRsc = this.$resource(this.BASE_URL,
        {},
        {
          getExperiments: buildAction({
            method: 'GET',
            isArray: true,
            url: `${this.BASE_URL}/experiments`
          }),
          getFile: buildAction({
            method: 'GET',
            isArray: false,
            transformResponse: (data, header, status) => ({ uuid: header('uuid'), data }),
            url: `${this.BASE_URL}/:experimentId/:filename`
          }),
          getBlob: buildAction({
            method: 'GET',
            isArray: false,
            responseType: 'blob',
            transformResponse: (data, header, status) => ({ uuid: header('uuid'), data }),
            url: `${this.BASE_URL}/:experimentId/:filename`
          }),
          deleteFile: buildAction({
            method: 'DELETE',
            url: `${this.BASE_URL}/:experimentId/:filename`
          }),
          setFile: buildAction({
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            url: `${this.BASE_URL}/:experimentId/:filename`
          })
        });
    }

    onError(err) {
      let absoluteUrl = /^https?:\/\//i;
      if (err.status === 302) {
        //redirect
        let url = err.data;
        if (!absoluteUrl.test(url))
          url = `${this.PROXY_URL}${url}`;
        //localStorage.removeItem(this.STORAGE_KEY);
        this.$window.location.href = `${url}&client_id=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(location.href)}`;
      }
      return this.$q.reject(err);
    }

    getExperiments(filter) {
      return this.proxyRsc.getExperiments({ filter }).$promise;
    }

    getFileContent(experimentId, filename, byname = false) {
      return this.proxyRsc.getFile({ experimentId, filename, byname }).$promise;
    }

    getBlobContent(experimentId, filename, byname = false) {
      return this.proxyRsc.getBlob({ experimentId, filename, byname })
        .$promise
        .then(response => this.$q(resolve => {
          let reader = new FileReader();
          reader.addEventListener('loadend', e => {
            response.data = e.target.result.replace(/data:[^;]*;base64,/g, '');
            resolve(response);
          });
          reader.readAsDataURL(response.data);
        }));
    }

    deleteFile(experimentId, filename, byname = false) {
      return this.proxyRsc.deleteFile({ experimentId, filename, byname }).$promise;
    }

    setFileContent(experimentId, filename, fileContent, byname = false) {
      return this.proxyRsc.setFile({ experimentId, filename, byname }, fileContent).$promise;
    }
  }

  class StorageServerTokenManager {
    constructor($location, bbpConfig) {
      this.$location = $location;
      this.CLIENT_ID = bbpConfig.get('auth.clientId');
      this.STORAGE_KEY = `tokens-${this.CLIENT_ID}@https://services.humanbrainproject.eu/oidc`;

      this.checkForNewTokenToStore();
    }

    checkForNewTokenToStore() {
      let access_token = this.$location.search().storage_token;
      if (!access_token)
        return;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([{ access_token }]));
      this.$location.search({});
    }

    getStoredToken() {
      let storedItem = localStorage.getItem(this.STORAGE_KEY);
      if (!storedItem)
        // this token will be rejected by the server and the client will get a proper auth error
        return 'no-token';

      try {
        let tokens = JSON.parse(storedItem);
        return tokens[tokens.length - 1].access_token;
      } catch (e) {
        // this token will be rejected by the server and the client will get a proper auth error
        return 'malformed-token';
      }
    }
  }

  angular.module('storageServer', ['ngResource', 'bbpConfig', 'ui.router'])
    .service('storageServer', ['$resource', '$window', '$q', '$stateParams', 'bbpConfig', 'storageServerTokenManager', (...args) => new StorageServer(...args)])
    .service('storageServerTokenManager', ['$location', 'bbpConfig', (...args) => new StorageServerTokenManager(...args)])
    .factory('storageServerRequestInterceptor', ['storageServerTokenManager',
      storageServerTokenManager => ({
        request: function(requestConfig) {
          var token = storageServerTokenManager.getStoredToken();
          requestConfig.headers.Authorization = 'Bearer ' + token;
          return requestConfig;
        }
      })
    ])
    .config(['$httpProvider', $httpProvider =>
      $httpProvider.interceptors.push('storageServerRequestInterceptor')
    ]);
}());