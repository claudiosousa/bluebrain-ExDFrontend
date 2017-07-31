(function() {
  'use strict';

  /*jshint -W117 */
  class TemplateExperimentsService extends BaseExperimentsService {
    /*jshint +W117 */

    constructor(experimentProxyService, ...baseDependencies) {
      super(...baseDependencies);

      this.experimentProxyService = experimentProxyService;
    }

    getExperiments() {
      return this.experimentProxyService
        .getExperiments()
        .then(experiments => _.map(experiments, (exp, id) => {
          exp.id = id;
          return exp;
        }));
    }

    getExperimentImage(exp) {
      return this.experimentProxyService
        .getImages([exp.id])
        .then(images => images[exp.id]);
    }
  }

  window.TemplateExperimentsService = TemplateExperimentsService;
})();