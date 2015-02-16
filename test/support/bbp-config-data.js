'use strict';
window.bbpConfig = {
  'api': {
    'task': {
      'v1': 'https://services-test.humanbrainproject-test.eu/task/v0/api',
      'v0': 'https://services-test.humanbrainproject-test.eu/task/v0/api'
    },
    'bluepy': {
        'v0': 'https://services-test.humanbrainproject-test.eu/bluepy/v0/api'
    },
    'simconfig': {
      'v0': 'https://services-test.humanbrainproject-test.eu/bluepy/v0/api'
    },
    'user': {
      'v1': 'https://services-test.humanbrainproject-test.eu/oidc/v0/api',
      'v0': 'https://services-test.humanbrainproject-test.eu/oidc/v0/api'
    },
    'document': {
      'v1': 'https://services-test.humanbrainproject-test.eu/document/v0/api',
      'v0': 'https://services-test.humanbrainproject-test.eu/document/v0/api'
    },
    'provenance': {
      'v2': 'https://services-test.humanbrainproject-test.eu/provenance/v0/api',
      'v1': 'https://services-test.humanbrainproject-test.eu/provenance/v0/api',
      'v0': 'https://services-test.humanbrainproject-test.eu/provenance/v0/api'
    },
    'neurorobotics': {
      'gzweb': {
        'development1': {
          'websocket': 'ws://localhost:7681',
          'assets': 'http://localhost:8080/assets',
          'nrp-services': "http://bbpce016.epfl.ch:8080"
        }
      },
      'rosbridge': {
        'websocket': 'ws://bbpce015.epfl.ch:9090',
        'topics': {
          'status': '/ros_cle_simulation/status'
        }
      }
    }
  },
  'auth': {
    'url': 'https://services-test.humanbrainproject-test.eu/oidc',
    'clientId': 'portal-client'
  },
  'oidc': {
    'debug': false
  },
  'up': {
    'sites': [{
      'name': 'Public',
      'url': 'https://humanbrainproject.eu'
    }, {
      'name': 'Unified Platform',
      'url': 'http://localhost:9999'
    }, {
      'name': 'Collaboration',
      'url': 'https://collaboration.humanbrainproject.eu'
    }, {
      'name': 'Education',
      'url': 'https://education.humanbrainproject.eu'
    }],
    'apps': [{
      'name': 'Different Domain',
      'type': 'external',
      'url': 'http://localhost:9880'
    }, {
      'name': 'Same Domain',
      'type': 'external',
      'url': 'http://localhost:9999'
    }],
    'resourceUrlWhitelist': [
      'https://humanbrainproject.eu/**',
      'https://*.humanbrainproject.eu/**',
      'http://localhost:*/'
    ]
  }
};
