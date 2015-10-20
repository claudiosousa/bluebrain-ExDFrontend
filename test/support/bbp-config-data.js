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
    "neurorobotics": {
      "bbpce014": {
        "gzweb": {
          "websocket": "ws://bbpce014.epfl.ch:7681",
          "assets": "http://bbpce014.epfl.ch",
          "nrp-services": "http://bbpce014.epfl.ch:8080"
        },
        "rosbridge": {
          "websocket": "ws://bbpce014.epfl.ch:9090",
          "topics": {
            "status": "/ros_cle_simulation/status"
          }
        }
      },
      "bbpce016": {
        "gzweb": {
          "websocket": "ws://bbpce016.epfl.ch:7681",
          "assets": "http://bbpce016.epfl.ch",
          "nrp-services": "http://bbpce016.epfl.ch:8080"
        },
        "rosbridge": {
          "websocket": "ws://bbpce016.epfl.ch:9090",
          "topics": {
            "status": "/ros_cle_simulation/status"
          }
        }
      },
      "bbpce018": {
        "gzweb": {
          "websocket": "ws://bbpce018.epfl.ch:7681",
          "assets": "http://bbpce018.epfl.ch",
          "nrp-services": "http://bbpce018.epfl.ch:8080"
        },
        "rosbridge": {
          "websocket": "ws://bbpce018.epfl.ch:9090",
          "topics": {
            "status": "/ros_cle_simulation/status"
          }
        }
      },
      "bbpsrvc020": {
        "gzweb": {
          "websocket": "ws://bbpsrvc020.epfl.ch:7681",
          "assets": "http://bbpsrvc020.epfl.ch",
          "nrp-services": "http://bbpsrvc020.epfl.ch:8080"
        },
        "rosbridge": {
          "websocket": "ws://bbpsrvc020.epfl.ch:9090",
          "topics": {
            "status": "/ros_cle_simulation/status"
          }
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
  },
  "localmode" : {
    "forceuser": false,
    "ownerID": "vonarnim"
  }
};
