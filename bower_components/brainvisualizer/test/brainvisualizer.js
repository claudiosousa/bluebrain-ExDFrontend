'use strict';

describe('Brainvisualizer', function ()
{
  function triggerEvent(element, eventName)
  {
    var event; // The custom event that will be created

    if (document.createEvent)
    {
      event = document.createEvent("HTMLEvents");
      event.initEvent(eventName, true, true);
    } else
    {
      event = document.createEventObject();
      event.eventType = eventName;
    }

    event.eventName = eventName;

    if (document.createEvent)
    {
      element.dispatchEvent(event);
    } else
    {
      element.fireEvent("on" + event.eventType, event);
    }
  }
  window.document.body.innerHTML += '<div class="braincontainer"></div>';

  var brainvisualizer = new BRAIN3D.MainView(window.document.getElementsByClassName("braincontainer")[0], BRAIN3D.embeddedData, 'img/brain3dball.png', 'img/brain3dballsimple.png');
  brainvisualizer.setClipPlanes(10, 20);
  brainvisualizer.setPointSize(10);
  brainvisualizer.periodicalUpdate();   // Simulate an update
  brainvisualizer.updateSize(); // Simulate update size

  brainvisualizer.mouseIsDown = true;
  brainvisualizer.periodicalUpdate();   // Simulate an update with mouse down
  brainvisualizer.mouseIsDown = false;

  triggerEvent(brainvisualizer.container, "mousedown");
  triggerEvent(brainvisualizer.container, "mouseup");
  triggerEvent(brainvisualizer.container, "mousemove");
  triggerEvent(brainvisualizer.container, "mousewheel");
  triggerEvent(brainvisualizer.container, "DOMMouseScroll");

/*  brainvisualizer.mouseUp({});
  brainvisualizer.mouseWheel({});
  brainvisualizer.mouseMove({});*/

  brainvisualizer.cameraZoom = 17;
  brainvisualizer.periodicalUpdate();   // Simulate an update with different camera zoom

  it('camera should be initialized', function ()
  {
    expect(brainvisualizer.camera).toBeDefined();
  });

  it('scene should be initialized', function ()
  {
    expect(brainvisualizer.scene).toBeDefined();
  });

  it('pause should be true', function ()
  {
    brainvisualizer.setPaused(true);
    expect(brainvisualizer.paused).toBe(true);
    brainvisualizer.setPaused(false);
  });

  it('layer should be filled', function ()
  {
    expect(brainvisualizer.layer.length).toBeGreaterThan(0);
  });

  it('area should be filled', function ()
  {
    expect(brainvisualizer.area.length).toBeGreaterThan(0);
  });

  it('width result should be defined', function ()
  {
    expect(brainvisualizer.width()).toBeDefined();
  });

  it('height result should be defined', function ()
  {
    expect(brainvisualizer.height()).toBeDefined();
  });

  it('min clip plane wrong value', function ()
  {
    expect(brainvisualizer.minRenderDist).toBe(10);
  });

  it('max clip plane wrong value', function ()
  {
    expect(brainvisualizer.maxRenderDist).toBe(20);
  });

  it('point size wrong value', function ()
  {
    expect(brainvisualizer.ptsize).toBe(10);
  });

  it('color map wrong value', function ()
  {
    brainvisualizer.setColorMap(BRAIN3D.COLOR_MAP_CORTEXLAYERS);
    expect(brainvisualizer.colormap).toBe(BRAIN3D.COLOR_MAP_CORTEXLAYERS);

    brainvisualizer.setColorMap(BRAIN3D.COLOR_MAP_AREAS);
    expect(brainvisualizer.colormap).toBe(BRAIN3D.COLOR_MAP_AREAS);

    brainvisualizer.setColorMap(BRAIN3D.COLOR_MAP_NONE);
    expect(brainvisualizer.colormap).toBe(BRAIN3D.COLOR_MAP_NONE);
  });

  it('sphere type wrong value', function ()
  {
    brainvisualizer.setSphereType(BRAIN3D.SPHERE_TYPE_BLENDED);
    expect(brainvisualizer.spheretype).toBe(BRAIN3D.SPHERE_TYPE_BLENDED);

    brainvisualizer.setSphereType(BRAIN3D.SPHERE_TYPE_SPHERE);
    expect(brainvisualizer.spheretype).toBe(BRAIN3D.SPHERE_TYPE_SPHERE);

    brainvisualizer.setSphereType(BRAIN3D.SPHERE_TYPE_POINT);
    expect(brainvisualizer.spheretype).toBe(BRAIN3D.SPHERE_TYPE_POINT);

    brainvisualizer.setSphereType(BRAIN3D.SPHERE_TYPE_SIMPLE);
    expect(brainvisualizer.spheretype).toBe(BRAIN3D.SPHERE_TYPE_SIMPLE);

  });


});
