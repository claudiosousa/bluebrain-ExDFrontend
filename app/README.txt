The image files in the directory app/style/images are copied from gz3d-hbp/gz3d/client/style/images (see grunt task copy:gz3dImages) so as to avoid 404 errors. Indeed, gz3d-hbp/gz3d/build/gz3d.js creates an object of
the class GZ3D.RadialMenu whose constructor request these files (from gz3dradialmenu.js):

  // Add items to the menu
  this.addItem('delete','style/images/trash.png');
  this.addItem('translate','style/images/translate.png');
  this.addItem('rotate','style/images/rotate.png');
  this.addItem('transparent','style/images/transparent.png');
  this.addItem('wireframe','style/images/wireframe.png');
  this.addItem('joints','style/images/joints.png');

This problem is reported in Jira issue [NRRPLT-3145]
These png files are also copied to dist/style/images for deployment (see grunt task copy:dist)
You can remove app/style with the command 'grunt clean:server'
You can remove dist/style with the command 'grunt clean:dist'
The folder app/style is git-ignored (see .gitignore).
