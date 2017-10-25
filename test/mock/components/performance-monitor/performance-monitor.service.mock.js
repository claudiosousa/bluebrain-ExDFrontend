(function() {
  'use strict';

  angular
    .module('performanceMonitorServiceMock', [])
    .service('performanceMonitorService', function() {
      this.getConfig = jasmine.createSpy('getConfig').and.returnValue({
        type: 'pie',
        data: {
          datasets: [
            {
              data: [1.0, 2.0, 42.0],
              backgroundColor: ['blue', 'green', 'yellow'],
              label: 'Performance Monitoring Mock'
            }
          ],
          labels: ['Neural Simulation', 'World simulation', 'Some TF']
        },
        options: {
          responsive: true
        }
      });

      this.processStateChange = jasmine.createSpy('processStateChange');
      this.registerClient = jasmine.createSpy('registerClient');
      this.unregisterClient = jasmine.createSpy('unregisterClient');
    });
})();
