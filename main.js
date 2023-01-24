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



const favDialog = document.getElementById('favDialog');
const nameElement = document.getElementById('fname');
const typeElement = document.getElementById('ftype');
const confirmBtn = favDialog.querySelector('#confirmBtn');
var selectedFeatureId = -1;

var currentDraw;
var currentSelect;



// "Confirm" button of form triggers "close" on dialog because of [method="dialog"]
favDialog.addEventListener('close', () => {
  if (selectedFeatureId >= 0) {
    
    var f = planningAppsSource.getFeatureById(selectedFeatureId);
    f.set('name', nameElement.value);
    f.set('styleTemplate', typeElement.value);

  }
});



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

    const button_point = document.createElement('button');
    button_point.innerHTML = '•';

    const button_line = document.createElement('button');
    button_line.innerHTML = '<i class="fa-solid fa-slash"></i>';

    const button_area = document.createElement('button');
    button_area.innerHTML = '<i class="fa-solid fa-draw-polygon"></i>';

    const element = document.createElement('div');
    element.className = 'editmode ol-unselectable ol-control';
    element.appendChild(button_edit);
    element.appendChild(button_point);
    element.appendChild(button_line);
    element.appendChild(button_area);

    super({
      element: element,
      target: options.target,
    });

    //button.addEventListener('click', this.handleEditMode.bind(this), false);
  }
  enabled = false;

  handleEditMode() {

  }
}


class DownloadGeoJsonControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
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
    var geoJsonStr = format.writeFeatures(planningAppsSource.getFeatures());

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(JSON.parse(geoJsonStr), null, 2));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "cities.json");
    dlAnchorElem.click();
  }
}

class DrawRoadControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
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
  /**
   * @param {Object} [opt_options] Control options.
   */
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
}


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


const wm_full = new ImageLayer({
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

const wm_rough = new ImageLayer({
  title: 'Faerun (Overview)',
  type: 'base',
  visible: true,
  source: new Static({
    url: 'sourcemaps/faerun-rough.png',
    projection: projection,
    imageExtent: extent,
  }),
  zIndex:8
});

const cormyr_unlabeled = new ImageLayer({
  title: 'Cormyr',
  source: new Static({
    url: 'sourcemaps/cormyr-unlabeled.png',
    projection: projection,
    imageExtent: extent2,
  }),
  minZoom: 3,
  zIndex: 12
});

const shadowdale = new ImageLayer({
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

const shadowdale_rough = new ImageLayer({
  title: 'Shadowdale (Explored)',
  source: new Static({
    url: 'sourcemaps/shadowdale-sepia.png',
    projection: projection,
    imageExtent: extent5,
  }),
  minZoom: 8,
  zIndex: 40
});

var planningAppsSource = new VectorSource({
  format: new GeoJSON(),
  url: 'sourcemaps/markers.geojson'
});

// Create a vector layer to display the features within the GeoJSON source and
// applies a simple icon style to all features
var planningAppsLayer = new VectorLayer({
  title: 'Markers',
  visible: true,
  source: planningAppsSource,
  style: function(feature, resolution){
    var baseStyle;
    if (styles[feature.get('styleTemplate')]) {
      baseStyle = styles[feature.get('styleTemplate')].clone();
    } else {
      baseStyle = new Style();
    }
    return baseStyle;
  },
});

var planningAppsLayer2 = new VectorLayer({
  title: 'Labels',
  visible: true,
  source: planningAppsSource,
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

const cormyrMap = new LayerGroup({
  title: 'Eastern Heartlands',
  visible: true,
  combine: true,
  zIndex: 12,
  layers: [cormyr_unlabeled],
});

const roadsAndCities = new LayerGroup({
  title: 'Roads and Cities',
  visible: true,
  combine: true,
  zIndex: 15,
  layers: [planningAppsLayer, planningAppsLayer2],
});

const wheloon = new ImageLayer({
  title: 'Wheloon',
  source: new Static({
    url: 'sourcemaps/wheloon.jpg',
    projection: projection,
    imageExtent: extent3,
  }),
  minZoom: 8,
  zIndex: 100,
});


const baseMaps = new LayerGroup({
  title: 'Continent',
  visible: true,
  layers: [wm_full, wm_rough],
});

const overlayMaps = new LayerGroup({
  title: 'Detail Maps',
  visible: true,
  layers: [roadsAndCities, cormyrMap, wheloon, shadowdale, shadowdale_rough],
});

const select = new Select();

const modify = new Modify({
  features: select.getFeatures(),
});

const drawRoad = new Draw({
  type: 'LineString',
  source: planningAppsSource,
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
  source: planningAppsSource,
});

drawCity.on('drawend', function(event) {
  var fid = getUid(event.feature);
  
  event.feature.setId(fid);
  selectedFeatureId = fid;
  event.feature.set('styleTemplate', 'City');

  favDialog.showModal();

})

const snap = new Snap({
  source: planningAppsSource,
});


const map = new Map({
  controls: defaultControls().extend([new DrawRoadControl(), new DrawCityControl(), new DownloadGeoJsonControl(), new EditModeControl()]),
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
//map.addLayer(planningAppsLayer);

map.getView().on('change:resolution', (event) => {
  styles['City'].getImage().setRadius(Math.max(Math.min(styles['City'].defaultRadius/event.oldValue, 8),3));
  styles['MajorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MajorRoad'].defaultWidth/event.oldValue, 4),0.5));
  styles['MinorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MinorRoad'].defaultWidth/event.oldValue, 3),0.25));
});

styles['City'].getImage().setRadius(Math.max(Math.min(styles['City'].defaultRadius/map.getView().getResolution(), 8),3));
styles['MajorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MajorRoad'].defaultWidth/map.getView().getResolution(), 4),0.5));
styles['MinorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MinorRoad'].defaultWidth/map.getView().getResolution(), 3),0.25));



