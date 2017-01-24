function setupBrowser() {
  //variables
  var width = 1920;
  var height = 1080;

  //browser setup
  browser.driver.manage().window().setSize(width, height);
}

module.exports = {
  setupBrowser
};