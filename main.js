import './style.scss';

import ImageLayer from 'ol/layer/Image';
import Map from 'ol/Map';
import Projection from 'ol/proj/Projection';
import Static from 'ol/source/ImageStatic';
import View from 'ol/View';
import {getCenter} from 'ol/extent';
import LayerGroup from 'ol/layer/Group';

import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import LayerSwitcher from 'ol-layerswitcher';
import {Circle, Fill, Stroke, Text, Style} from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import {Vector as VectorSource} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';

import {Draw, Modify, Select, Snap} from 'ol/interaction';
import {Control, defaults as defaultControls} from 'ol/control';
import { closestOnCircle } from 'ol/coordinate';
import { getUid } from 'ol/util';




const nameElement = document.getElementById('fname');
const typeElement = document.getElementById('ftype');
var selectedFeatureId = -1;

var currentDraw;
var currentSelect;
var editableVectorSources = {};
var drawElement = null;
var snap = null;
var editMode = true;







//
// Define rotate to north control.
//

class EditModeControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};
    
    const button_edit = document.createElement('button');
    button_edit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    button_edit.id = "button_edit";
    
    const button_point = document.createElement('button');
    button_point.innerHTML = '•';
    button_point.classList.add("hiddenElement");
    button_point.id = "button_point";
    button_point.drawType = "Point";
    button_point.defaultStyle = "City";

    const button_line = document.createElement('button');
    button_line.innerHTML = '<i class="fa-solid fa-slash"></i>';
    button_line.classList.add("hiddenElement");
    button_line.id = "button_line";
    button_line.drawType = "LineString";
    button_line.defaultStyle = "MajorRoad";

    const button_area = document.createElement('button');
    button_area.innerHTML = '<i class="fa-solid fa-draw-polygon"></i>';
    button_area.classList.add("hiddenElement");
    button_area.id = "button_area";
    button_area.drawType = "Polygon";
    button_area.defaultStyle = "MajorRoad";

    const button_modify = document.createElement('button');
    button_modify.innerHTML = '<i class="fa-solid fa-up-down-left-right"></i>';
    button_modify.classList.add("hiddenElement");
    button_modify.id = "button_modify";

    const button_download = document.createElement('button');
    button_download.innerHTML = '<i class="fa-solid fa-download"></i>';
    button_download.classList.add("hiddenElement");
    button_download.id = "button_download";

    const select_layer = document.createElement('select');
    select_layer.classList.add("hiddenElement");
    select_layer.id = "select_layer";

    const dialog_style = document.getElementById('dialog_style');

    const element = document.createElement('div');
    element.className = 'editmode ol-unselectable ol-control';
    element.appendChild(button_edit);
    element.appendChild(button_point);
    element.appendChild(button_line);
    element.appendChild(button_area);
    element.appendChild(button_modify);
    element.appendChild(select_layer);
    element.appendChild(button_download);

    super({
      element: element,
      target: options.target,
    });

    button_edit.addEventListener('click', this.handleOpenMenu.bind(this), false);
    button_point.addEventListener('click', this.handleDrawStart.bind(this), false);
    button_line.addEventListener('click', this.handleDrawStart.bind(this), false);
    button_area.addEventListener('click', this.handleDrawStart.bind(this), false);

    button_download.addEventListener('click', this.handleDownload.bind(this), false);
    
    dialog_style.addEventListener('close', this.handleStyleSelection.bind(this), false);
    

  }

  active = false;
  draw = false;


  handleStyleSelection() {
    if (selectedFeatureId >= 0) {
      var f = editableVectorSources[select_layer.value].getFeatureById(selectedFeatureId);
      f.set('name', nameElement.value);
      f.set('styleTemplate', typeElement.value);
      selectedFeatureId = -1;
    }
  }

  handleOpenMenu() {
    if (this.draw) {
      button_edit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
      button_edit.defaultStyle = null;

      map.removeInteraction(drawElement);
      map.removeInteraction(snap);
      this.draw = false;

    } else {
      if (!this.active) {
        var children = Array.from(this.element.childNodes);
        children.forEach(function(child){
          child.classList.remove("hiddenElement");
        });
        var select_layer = document.getElementById('select_layer');
        if(!select_layer.options.length) {
          Object.keys(editableVectorSources).forEach(function(layerName){
            var opt = document.createElement('option');
            opt.value = layerName;
            opt.text = layerName;
            select_layer.options.add(opt);
          });
        }
        this.active = true;
      } else {
        this.closeMenu();
      }
    }
  }

  closeMenu() {
    var children = Array.from(this.element.childNodes);
    children.forEach(function(child){
      if(child.id != "button_edit"){
        child.classList.add("hiddenElement");
      }
    });
    this.active = false;
  }

  handleDrawStart(event) {
    if(this.draw) {
      console.log(this);
      this.closeMenu();
      map.removeInteraction(drawElement);
      map.removeInteraction(snap);
      this.draw = false;  
    } else {
      button_edit.innerHTML = event.currentTarget.innerHTML;
      button_edit.defaultStyle = event.currentTarget.defaultStyle;
      this.closeMenu();

      map.removeInteraction(drawElement);
      map.removeInteraction(snap);
      
      drawElement = new Draw({
        type: event.currentTarget.drawType,
        source: editableVectorSources[select_layer.value]});

      drawElement.on('drawend',this.handleDrawEnd);

      snap = new Snap({
        source: editableVectorSources[select_layer.value]});

      map.addInteraction(drawElement);
      map.addInteraction(snap);
      this.draw = true;
    }
  }


  handleDrawEnd(event) {
    var fid = getUid(event.feature);
    
    event.feature.setId(fid);
    selectedFeatureId = fid;
    event.feature.set('styleTemplate', button_edit.defaultStyle);
  
    dialog_style.showModal();
  }

  handleDownload() {
    var format = new GeoJSON(); 
    var geoJsonStr = format.writeFeatures(editableVectorSources[select_layer.value].getFeatures());

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(JSON.parse(geoJsonStr), null, 2));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", select_layer.value + ".geojson");
    dlAnchorElem.click();
    this.closeMenu();
  }
}


// "Confirm" button of form triggers "close" on dialog because of [method="dialog"]


/*

class DownloadGeoJsonControl extends Control {
  constructor(opt_options) {
    const options = opt_options || {};
    

    const button = document.createElement('button');
    button.innerHTML = '<i class="fa-solid fa-download"></i>'; //fa-draw-polygon

    const element = document.createElement('div');
    element.className = 'download ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleDownload.bind(this), false);
  }
  enabled = false;

  handleDownload() {
    var format = new GeoJSON(); 
    var geoJsonStr = format.writeFeatures(heartlands_pc_src.getFeatures());

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(JSON.parse(geoJsonStr), null, 2));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "cities.json");
    dlAnchorElem.click();
  }
}

class DrawRoadControl extends Control {
  constructor(opt_options) {
    const options = opt_options || {};
    

    const button = document.createElement('button');
    button.innerHTML = '<i class="fa-solid fa-draw-polygon"></i>'; //

    const element = document.createElement('div');
    element.className = 'draw-territory ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleRoadTerritory.bind(this), false);
  }
  enabled = false;

  handleRoadTerritory() {
    if(this.enabled && currentDraw) {
      currentDraw.finishDrawing();
      this.enabled = false;
      this.element.classList.remove("drawActive");
      map.removeInteraction(currentDraw);
      map.removeInteraction(snap);
    } else {

      currentDraw = drawRoad; 
      map.addInteraction(currentDraw);
      map.addInteraction(snap);
      this.enabled = true;
      this.element.classList.add("drawActive");
    }
  }
}

class DrawCityControl extends Control {
  constructor(opt_options) {
    const options = opt_options || {};
    

    const button = document.createElement('button');
    button.innerHTML = '<i class="fa-solid fa-circle"></i>';

    const element = document.createElement('div');
    element.className = 'draw-city ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleDrawCity.bind(this), false);
  }
  enabled = false;

  handleDrawCity() {
    if(this.enabled && currentDraw) {

      this.enabled = false;
      this.element.classList.remove("drawActive");
      map.removeInteraction(currentDraw);
      map.removeInteraction(snap);
    } else {
      currentDraw = drawCity;
      map.addInteraction(currentDraw);
      map.addInteraction(snap);
      this.enabled = true;
      this.element.classList.add("drawActive");
    }
  }
}*/


// Map views always need a projection.  Here we just want to map image
// coordinates directly to map coordinates, so we create a projection that uses
// the image extent in pixels.
const extent = [0, 0, 4763, 3411];
const extent2 = [1603, 2032, 2782, 3022];
const extent3 = [2009, 2392, 2011.032, 2393.516];
const extent4 = [2135, 2807, 2138.107, 2808.997];
const extent5 = [2135, 2807, 2138.107, 2808.997];


const projection = new Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});

const styles = new Object;
const stylesLabel = new Object;

styles['MajorRoad'] = new Style({
  stroke: new Stroke({
    color: 'black',
    width: 2,
  }),
});
styles['MajorRoad'].defaultWidth = 2;
stylesLabel['MajorRoad'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '12px serif',
    placement: 'line',
    offsetY: 0
  })
})

styles['MinorRoad'] = new Style({
  stroke: new Stroke({
    color: 'black',
    width: 1.5,
  }),
});
styles['MinorRoad'].defaultWidth = 1.5;
stylesLabel['MinorRoad'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '12px serif',
    placement: 'line',
    offsetY: 0
  })
})

styles['River'] = new Style(null);
styles['River'].defaultWidth = 1.5;
stylesLabel['River'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '12px serif',
    placement: 'line',
    fill: new Fill({
      color: 'SteelBlue',
    }),
    offsetY: 0
  })
})

styles['Lake'] = new Style(null);
styles['Lake'].defaultWidth = 1.5;
stylesLabel['Lake'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '18px serif',
    placement: 'line',
    fill: new Fill({
      color: 'SteelBlue',
    }),
    offsetY: 0
  })
})

styles['Ocean'] = new Style(null);
styles['Ocean'].defaultWidth = 1.5;
stylesLabel['Ocean'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '22px serif',
    placement: 'line',
    fill: new Fill({
      color: 'SteelBlue',
    }),
    offsetY: 0
  })
})

styles['Mountain'] = new Style(null);
styles['Mountain'].defaultWidth = 1.5;
stylesLabel['Mountain'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '24px serif',
    placement: 'line',
    fill: new Fill({
      color: 'brown',
    }),
    offsetY: 0
  })
})

styles['Forest'] = new Style(null);
styles['Forest'].defaultWidth = 1.5;
stylesLabel['Forest'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '22px serif',
    placement: 'line',
    fill: new Fill({
      color: 'ForestGreen',
    }),
    offsetY: 0
  })
})

styles['City'] = new Style({
  image: new Circle({
    fill: new Fill({color: 'black'}),
    stroke: new Stroke({
      color: 'white',
      width: 1
    }),
    radius: 6,
  })
})
styles['City'].defaultRadius = 6;
stylesLabel['City'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '16px serif',
    offsetY: -12
  })
})


//ImageLayers

const faerun_gm = new ImageLayer({
  title: 'Faerun (GM)',
  type: 'base',
  visible: false,
  source: new Static({
    url: 'sourcemaps/faerun-detailed.png',
    projection: projection,
    imageExtent: extent,
  }),
  zIndex:8
});

const faerun_pc = new ImageLayer({
  title: 'Faerun (Players)',
  type: 'base',
  visible: true,
  source: new Static({
    url: 'sourcemaps/faerun-rough.png',
    projection: projection,
    imageExtent: extent,
  }),
  zIndex:8
});

const heartlands_pc = new ImageLayer({
  title: 'Western Heartlands (Players)',
  source: new Static({
    url: 'sourcemaps/cormyr-unlabeled.png',
    projection: projection,
    imageExtent: extent2,
  }),
  minZoom: 3,
  zIndex: 12
});

const shadowdale_gm = new ImageLayer({
  title: 'Shadowdale (GM)',
  source: new Static({
    url: 'sourcemaps/shadowdale-surrounding.jpg',
    projection: projection,
    imageExtent: extent4,
  }),
  minZoom: 8,
  zIndex: 30,
  visible: false
});

const shadowdale_pc = new ImageLayer({
  title: 'Shadowdale (Players)',
  source: new Static({
    url: 'sourcemaps/shadowdale-sepia.png',
    projection: projection,
    imageExtent: extent5,
  }),
  minZoom: 8,
  zIndex: 40
});

const wheloon_pc = new ImageLayer({
  title: 'wheloon',
  source: new Static({
    url: 'sourcemaps/wheloon.jpg',
    projection: projection,
    imageExtent: extent3,
  }),
  minZoom: 8,
  zIndex: 100,
});

//Vector Sources

var heartlands_pc_src = new VectorSource({
  format: new GeoJSON(),
  url: 'sourcemaps/markers.geojson'
});

var shadowdale_pc_src = new VectorSource({
  format: new GeoJSON(),
  url: 'sourcemaps/Shadowdale (Players).geojson'
});

//Vector Layers

var heartlands_pc_markers = new VectorLayer({
  title: 'Western Heratlands (Markers)',
  visible: true,
  source: heartlands_pc_src,
  style: function(feature, resolution){
    var baseStyle;
    if (styles[feature.get('styleTemplate')]) {
      baseStyle = styles[feature.get('styleTemplate')].clone();
    } else {
      baseStyle = new Style({});
    }
    if (editMode && !baseStyle.getStroke()) {
      baseStyle.setStroke(new Stroke({
        color: 'orange',
        width: 2
      }));
    }
    return baseStyle;
  },
});

var heartlands_pc_labels = new VectorLayer({
  title: 'Western Heartlands (Labels)',
  visible: true,
  source: heartlands_pc_src,
  style: function(feature, resolution){
    var baseStyle;
    if (stylesLabel[feature.get('styleTemplate')]) {
      baseStyle = stylesLabel[feature.get('styleTemplate')].clone();
    } else {
      baseStyle = new Style();
    }

    var label = feature.get('name');

      if (label) {
        if (baseStyle.getText()) {
          baseStyle.getText().setText(label);
        }
      }

    return baseStyle;
  },
  declutter: true,
});

var shadowdale_pc_markers = new VectorLayer({
  title: 'Shadowdale (Markers)',
  visible: true,
  source: shadowdale_pc_src,
  style: function(feature, resolution){
    var baseStyle;
    if (styles[feature.get('styleTemplate')]) {
      baseStyle = styles[feature.get('styleTemplate')].clone();
    } else {
      baseStyle = new Style({});
    }
    if (editMode && !baseStyle.getStroke()) {
      baseStyle.setStroke(new Stroke({
        color: 'orange',
        width: 2
      }));
    }
    return baseStyle;
  },
  zIndex: 45,
  minZoom: 8,
});

var shadowdale_pc_labels = new VectorLayer({
  title: 'Shadowdale (Labels)',
  visible: true,
  source: shadowdale_pc_src,
  style: function(feature, resolution){
    var baseStyle;
    if (stylesLabel[feature.get('styleTemplate')]) {
      baseStyle = stylesLabel[feature.get('styleTemplate')].clone();
    } else {
      baseStyle = new Style();
    }

    var label = feature.get('name');

      if (label) {
        if (baseStyle.getText()) {
          baseStyle.getText().setText(label);
        }
      }

    return baseStyle;
  },
  minZoom: 12,
  zIndex: 50,
  declutter: true,
});

//Layer Groups

const baseMaps = new LayerGroup({
  title: 'Continent',
  visible: true,
  layers: [faerun_gm, faerun_pc],
});

const heartlands_pc_lg = new LayerGroup({
  title: 'Eastern Heartlands',
  visible: true,
  combine: true,
  zIndex: 12,
  layers: [heartlands_pc, heartlands_pc_markers, heartlands_pc_labels],
});

const shadowdale_pc_lg = new LayerGroup({
  title: 'Shadowdale (Players)',
  visible: true,
  combine: true,
  zIndex: 12,
  layers: [shadowdale_pc, shadowdale_pc_markers, shadowdale_pc_labels],
});

const overlayMaps = new LayerGroup({
  title: 'Local Maps',
  visible: true,
  layers: [heartlands_pc_lg, wheloon_pc, shadowdale_gm, shadowdale_pc_lg],
});

/*
const roadsAndCities = new LayerGroup({
  title: 'Roads and Cities',
  visible: true,
  combine: true,
  zIndex: 15,
  layers: [heartlands_pc_markers, heartlands_pc_labels],
});*/

editableVectorSources['Western Heartlands (Players)'] = heartlands_pc_src;
editableVectorSources['Shadowdale (Players)'] = shadowdale_pc_src;

/*
const select = new Select();

const modify = new Modify({
  features: select.getFeatures(),
});

const drawRoad = new Draw({
  type: 'LineString',
  source: heartlands_pc_src,
});

drawRoad.on('drawend', function(event) {
  var fid = getUid(event.feature);
  
  event.feature.setId(fid);
  event.feature.set('styleTemplate', 'MajorRoad');
  selectedFeatureId = fid;

  favDialog.showModal();
})

const drawCity = new Draw({
  type: 'Point',
  source: heartlands_pc_src,
});

drawCity.on('drawend', function(event) {
  var fid = getUid(event.feature);
  
  event.feature.setId(fid);
  selectedFeatureId = fid;
  event.feature.set('styleTemplate', 'City');

  favDialog.showModal();

})

*/


const map = new Map({
  controls: defaultControls().extend([new EditModeControl()]),
  layers: [baseMaps, overlayMaps],
  target: 'map',
  view: new View({
    projection: projection,
    center: getCenter(extent),
    zoom: 2,
    maxZoom: 16,
  }),
});

const layerSwitcher = new LayerSwitcher({
  reverse: true,
  groupSelectStyle: 'group'
});
map.addControl(layerSwitcher);


// Add the layer to the map
//map.addLayer(heartlands_pc_markers);

map.getView().on('change:resolution', (event) => {
  styles['City'].getImage().setRadius(Math.max(Math.min(styles['City'].defaultRadius/event.oldValue, 8),3));
  styles['MajorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MajorRoad'].defaultWidth/event.oldValue, 4),0.5));
  styles['MinorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MinorRoad'].defaultWidth/event.oldValue, 3),0.25));
});

styles['City'].getImage().setRadius(Math.max(Math.min(styles['City'].defaultRadius/map.getView().getResolution(), 8),3));
styles['MajorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MajorRoad'].defaultWidth/map.getView().getResolution(), 4),0.5));
styles['MinorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MinorRoad'].defaultWidth/map.getView().getResolution(), 3),0.25));



