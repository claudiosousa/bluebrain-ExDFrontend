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
(function () {
  'use strict';

  class StorageServer {

    constructor($resource, $window, $location, bbpConfig) {
      this.$resource = $resource;
      this.$location = $location;
      this.$window = $window;
      this.CLIENT_ID = bbpConfig.get('auth.clientId');
      this.STORAGE_KEY = `tokens-${this.CLIENT_ID}@https://services.humanbrainproject.eu/oidc`;

      this.PROXY_URL = bbpConfig.get('api.proxy.url');
      this.BASE_URL = `${this.PROXY_URL}/storage`;

      this.checkForNewTokenToStore();
      this.buildStorageResource();

    }

    checkForNewTokenToStore() {
      let access_token = this.$location.search().storage_token;
      if (!access_token)
        return;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([{ access_token }]));
      this.$location.search({});
    }

    buildStorageResource() {
      this.proxyRsc = this.$resource(this.BASE_URL,
        { token: this.getStoredToken() },
        {
          getExperiments: {
            method: 'GET',
            isArray: true,
            interceptor: { responseError: (err) => this.onError(err) },
            url: `${this.BASE_URL}/experiments`
          }
        });
    }

    onError(err) {
      let absoluteUrl = /^https?:\/\//i;
      if (err.status === 302) {
        //redirect
        let url = err.data;
        if (!absoluteUrl.test(url))
          url = `${this.PROXY_URL}${url}`;
        this.$window.location.href = `${url}&client_id=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(location.href)}`;
      } else
        throw err;
    }

    getStoredToken() {
      let storedItem = localStorage.getItem(this.STORAGE_KEY);
      if (!storedItem)
        // this token will be rejected by the server and the client will get a proper auth error
        return 'no-token';

      try {
        return JSON.parse(storedItem)[0].access_token;
      } catch (e) {
        // this token will be rejected by the server and the client will get a proper auth error
        return 'malformed-token';
      }
    }

    getExperiments() {
      return this.proxyRsc.getExperiments().$promise;
    }

  }

  angular.module('storageServer', ['ngResource', 'bbpConfig'])
    .service('storageServer', ['$resource', '$window', '$location', 'bbpConfig', (...args) => new StorageServer(...args)]);

}());