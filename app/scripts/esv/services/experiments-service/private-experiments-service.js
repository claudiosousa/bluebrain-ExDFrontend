(function() {
  'use strict';


  /*jshint -W117 */
  class PrivateExperimentsService extends BaseExperimentsService {
    /*jshint +W117 */

    constructor(storageServer, $stateParams, experimentProxyService, ...baseDependencies) {
      super(...baseDependencies);

      this.storageServer = storageServer;
      this.$stateParams = $stateParams;
      this.experimentProxyService = experimentProxyService;
    }

    getExperiments() {
      return this.storageServer.getExperiments()
        .then(exps => this.mapToExperiments(exps))
        .then(exps => this.fillServersDataAndDetails(exps));
    }

    mapToExperiments(exps) {
      return exps.map(exp => ({
        configuration: { maturity: 'production' },
        id: exp.uuid
      }));
    }

    fillServersDataAndDetails(exps) {

      return this.$q.all([
        this.experimentProxyService.getAvailableServers(),
        this.$q.all(exps.map(({ id }) => this.experimentProxyService.getJoinableServers(this.$stateParams.ctx))),//TODO: contextId id to be replaced by experiementId once teh ExDBackend has been migrated
        this.$q.all(exps.map(exp => this.loadExperimentDetails(exp))),
      ])
        .then(([availableServers, joinableServers, experimentsDetails]) => {
          exps.forEach((exp, i) => {
            exp.availableServers = availableServers;
            exp.joinableServers = joinableServers[i];
            angular.extend(exp.configuration, experimentsDetails[i]);
          });
          return exps;
        });
    }

    getExperimentImage(exp) {
      return this.storageServer
        .getBlobContent(exp.id, exp.configuration.thumbnail, true)
        .then(response => response.data);
    }

    loadExperimentDetails(exp) {
      return this.storageServer.getFileContent(exp.id, 'experiment_configuration.exc', true)
        .then(file => {
          if (!file.uuid)
            return this.$q.reject('No experiment configuration file found');


          let xml = $.parseXML(file.data);
          let thumbnail = xml.getElementsByTagNameNS("*", "thumbnail")[0];
          let thumbnailContent;
          if (thumbnail)
            thumbnailContent = thumbnail.textContent;
          else {
            thumbnailContent = 'No text content for thumbnail';
            console.error('Experiment details: text content for thumbnail is missing');
          }

          return {
            name: xml.getElementsByTagNameNS("*", "name")[0].textContent,
            description: xml.getElementsByTagNameNS("*", "description")[0].textContent,
            thumbnail: thumbnailContent,
            timeout: parseInt(xml.getElementsByTagNameNS("*", "timeout")[0].textContent),
            experimentFile: file.data,
            experimentConfiguration: ''
          };
        });
    }
  }


  window.PrivateExperimentsService = PrivateExperimentsService;
})();