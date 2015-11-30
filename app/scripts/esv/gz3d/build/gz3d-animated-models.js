var GZ3D = GZ3D || {
  REVISION : '1'
};

GZ3D.AnimatedModel = function(scene) {
  this.scene = scene;
  this.loader = null;

  this.modelUri_animated = "";
  this.animatedModelFound = false;
  this.hideLinkVisuals = false;

  this.modelName = "";

  this.visualsToHide = [];

  this.serverSideModel = null;
};

// Helper function to find Visuals that need to be hidden when loading a client-side-only animated model
GZ3D.AnimatedModel.prototype.isVisualHidden = function(visual) {
  if (visual.geometry && visual.geometry.mesh) {
    for (var k = 0; k < this.visualsToHide.length; k++) {
      if (this.visualsToHide[k] == visual.geometry.mesh.filename) {
        return true;
      }
    }
  }
  return false;
};

// Function to check if a client-side-only file for an animated model is available
GZ3D.AnimatedModel.prototype.animatedModelAvailable = function(model) {
  var uriPath = GZ3D.assetsPath;

  for (var j = 0; j < model.link.length; ++j) {
    var link = model.link[j];

    for (var k = 0; k < link.visual.length; k++) {
      var geom = link.visual[k].geometry;
      if (geom && geom.mesh) {
        var meshUri = geom.mesh.filename;
        // This saves all visuals of a model here because access to the loaded model after the loading
        // process finished is more difficult to implement. The optimal solution would be to actually
        // do this only after an animated model was found.
        this.visualsToHide.push(geom.mesh.filename);
        var uriType = meshUri.substring(0, meshUri.indexOf('://'));
        if (uriType === 'file' || uriType === 'model') {
          var modelUri = meshUri.substring(meshUri.indexOf('://') + 3);
          var modelName = modelUri.substring(0, modelUri.indexOf('/'));
          var modelUriCheck = uriPath + '/' + modelName + '/meshes/' + modelName + '_animated.dae';
          var checkModel = new XMLHttpRequest();

          checkModel.open('HEAD', modelUriCheck, false);
          try {
            checkModel.send();
          } catch (err) {
            console.log(modelUriCheck + ': no animated version');
          }
          if (checkModel.status !== 404) {
            this.modelUri_animated = modelUriCheck;
            this.animatedModelFound = true;
            this.hideLinkVisuals = true;
            this.modelName = model.name;
            this.serverSideModel = model;
            break;
          }
        }
      }
    }
  }
  return this.animatedModelFound;
};

GZ3D.AnimatedModel.prototype.loadAnimatedModel = function(modelName) {
  this.loader = new THREE.ColladaLoader();

  // Helper function to enable 'skinning' property so three.js treats meshes as deformable

  var enableSkinning = function (skinnedMesh) {
    var materials = skinnedMesh.material.materials;
    if (materials !== null && materials !== undefined) {
      for (var i = 0, length = materials.length; i < length; i++) {
        var mat = materials[i];
        mat.skinning = true;
      }
    }

    if (skinnedMesh.material !== undefined && skinnedMesh.material !== null) {
      skinnedMesh.material.skinning = true;
    }
  };

  // Load animated model with separate COLLADA loader instance
  var that = this;
  // Progress update: Add this asset to the assetProgressArray
  var element = {};
  element.id = modelName;
  element.url = this.modelUri_animated;
  element.progress = 0;
  element.totalSize = 0;
  element.done = false;
  GZ3D.assetProgressData.assets.push(element);
  this.loader.load(this.modelUri_animated, function (collada) {
    var modelParent = new THREE.Object3D();
    modelParent.name = modelName + "_animated";
    var linkParent = new THREE.Object3D();

    // Set gray, phong-shaded material for loaded model
    // TODO: Texturing/GLSL shading; find out what is available in the COLLADA loader implementation
    collada.scene.traverse (function (child) {
      if (child instanceof THREE.Mesh) {
        var transparentMaterial = new THREE.MeshPhongMaterial({color: 0x707070});
        transparentMaterial.wireframe = false;
        child.material = transparentMaterial;
      }
    });

    // Enable skinning for all child meshes
    collada.scene.traverse(function (child) {
      if (child instanceof THREE.SkinnedMesh) {
        enableSkinning(child);
      }
    });

    linkParent.add(collada.scene);

    // Hide model coordinate frames for the time being; remove as soon as position offset and rotation axis issues are fixed
    /*var collada_scene_axes = new THREE.AxisHelper(2);
     linkParent.add(collada_scene_axes);*/

    modelParent.add(linkParent);

    // Hide model coordinate frames for the time being; remove as soon as position offset and rotation axis issues are fixed
    /*var model_parent_axes = new THREE.AxisHelper(4);
     modelParent.add(model_parent_axes);*/

    // Temporary fix for offset between mouse model defined in SDF and client-side COLLADA model; cause remains to be investigated
    modelParent.position.y = modelParent.position.y + 5;
    modelParent.position.z = modelParent.position.z + 0.62;

    // Build list of bones in rig, and attach it to scene node (userData) for later retrieval in animation handling
    var getBoneList = function (object) {
      var boneList = [];

      if (object instanceof THREE.Bone) {
        boneList.push(object);
      }

      for (var i = 0; i < object.children.length; i++) {
        boneList.push.apply(boneList, getBoneList(object.children[i]));
      }

      return boneList;
    };

    var boneList = getBoneList(collada.scene);
    var boneHash = {};
    for (var k = 0; k < boneList.length; k++) {
      boneHash[boneList[k].name] = boneList[k];
    }
    // Skeleton visualization helper class
    var helper = new THREE.SkeletonHelper(collada.scene);

    boneHash['Skeleton_Visual_Helper'] = helper;
    modelParent.userData = boneHash;

    helper.material.linewidth = 3;
    // Hide skeleton helper for the time being
    // TODO: Make this configurable for visualizing the underlying skeleton
    helper.visible = false;

    that.scene.add(helper);
    that.scene.add(modelParent);

    // Progress update: execute callback
    element.done = true;
    if (GZ3D.assetProgressCallback) {
      GZ3D.assetProgressCallback(GZ3D.assetProgressData);
    }
  }, function(progress){
    element.progress = progress.loaded;
    element.totalSize = progress.total;
    element.error = progress.error;
    if (GZ3D.assetProgressCallback) {
      GZ3D.assetProgressCallback(GZ3D.assetProgressData);
    }
  });
};

GZ3D.AnimatedModel.prototype.updateJoint = function(robotName, jointName, jointValue, jointAxis) {
  // Check if there is an animated model for it on the client side
  var entity = this.scene.getByName(robotName + "_animated");
  if (entity) {
    if (entity.userData !== undefined && entity.userData !== null) {
      var boneName = jointName;

      // Retrieve bone instance from userData map of bone instances in animated model
      if (entity.userData[boneName] !== undefined && entity.userData[boneName] !== null) {
        var targetBone = entity.userData[boneName];
        var rotationAxis = jointAxis;
        var rotationAngle = jointValue;

        var rotationMatrix = new THREE.Matrix4();
        rotationMatrix.identity();
        rotationMatrix.makeRotationAxis(rotationAxis, rotationAngle);

        targetBone.setRotationFromMatrix(rotationMatrix);

        // Update animation handler and skeleton helper
        // TODO: Move this to the animation loop to synchronize animations with the actual frame rate.
        // Alternative: Use the clock helper class from three.js for retrieving the actual frame rate delta.
        entity.userData['Skeleton_Visual_Helper'].update(0.016);
        THREE.AnimationHandler.update(0.016);
      }
    }
  }
};
