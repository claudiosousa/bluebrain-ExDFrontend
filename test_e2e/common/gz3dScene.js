function setupGz3dHelper() {

  window.gz3dHelper = {
    gz3d: angular.element('.gz3d-container').scope().gz3d,
    toScreenPosition: function(obj) {
      var vector = new THREE.Vector3();

      var widthHalf = 0.5 * this.gz3d.scene.renderer.context.canvas.width;
      var heightHalf = 0.5 * this.gz3d.scene.renderer.context.canvas.height;

      obj.updateMatrixWorld();
      vector.setFromMatrixPosition(obj.matrixWorld);
      vector.project(this.gz3d.scene.camera);

      vector.x = (vector.x * widthHalf) + widthHalf;
      vector.y = - (vector.y * heightHalf) + heightHalf;

      return {
        x: vector.x,
        y: vector.y
      };

    },
    getObjectByName: function(objectName) {
      return this.gz3d.scene.getByName(objectName);
    },
    selectObject: function(obj) {
      this.gz3d.scene.selectEntity(obj);
    },
    triggerMouseEvent: function(eventType, event) {
      $('.gz3d-webgl').trigger($.Event(eventType, event));
    },
    //keyCode example: 'KeyW', 'KeyA', etc
    triggerKeyboardEvent: function(down = true, keyCode) {
      var event = new Event(down ? 'keydown' : 'keyup');
      event.code = keyCode;
      document.body.dispatchEvent(event);
    },
    getCameraDirection: function() {
      return JSON.parse(JSON.stringify(this.gz3d.scene.camera.getWorldDirection()));
    },
    getCameraPosition: function() {
      return JSON.parse(JSON.stringify(this.gz3d.scene.camera.getWorldPosition()));
    },
    triggerClick: function(objectName, button = 1) {
      var objectPosition = this.toScreenPosition(this.getObjectByName(objectName));
      this.triggerMouseEvent("mousedown", { button: button, clientX: objectPosition.x, clientY: objectPosition.y });
    },
    changeColor: function(objectName, material) {
      this.triggerClick(objectName, 2);
      $('#contextmenu [color="' + material + '"]').click();
    },
  };
}

function changeLeftTvToRed() {
  gz3dHelper.changeColor("left_vr_screen", "Gazebo/Red");
}

function setupAndExecute(fn, ...args) {
  if (args.length) {  //concatenate argument's values to stringified function
    fn = "(" + fn + "(" + args.map(arg => typeof arg == "string" ? "'" + arg + "'" : arg).join(',') + "))()"
  }

  return browser.executeScript(setupGz3dHelper)
    .then(() => browser.executeScript(fn));
}

module.exports = {
  changeLeftTvToRed: () => setupAndExecute(changeLeftTvToRed),
  pressKeyDown: (key) => setupAndExecute(() => gz3dHelper.triggerKeyboardEvent, true, key),
  pressKeyUp: (key) => setupAndExecute(() => gz3dHelper.triggerKeyboardEvent, false, key),
  getCameraDirection: () => setupAndExecute(() => gz3dHelper.getCameraDirection()),
  getCameraPosition: () => setupAndExecute(() => gz3dHelper.getCameraPosition())
};