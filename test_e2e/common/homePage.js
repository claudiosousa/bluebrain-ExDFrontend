var parameters = require('../parameters.js');
var common = require('./common.js');

function navigateToHomePage() {
  return common.navigateToUrl(parameters.url.Start);
}

module.exports = {
  navigateToHomePage
};