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
const selectEl = document.getElementById('fname');
const confirmBtn = favDialog.querySelector('#confirmBtn');
var selectedFeatureId = -1;

var currentDraw;
var currentSelect;

// "Favorite animal" input sets the value of the submit button
selectEl.addEventListener('change', (e) => {
  confirmBtn.value = selectEl.value;
});

favDialog.onLoaded = function(args) {

}

// "Confirm" button of form triggers "close" on dialog because of [method="dialog"]
favDialog.addEventListener('close', () => {
  if (selectedFeatureId >= 0) {
    
    var test = planningAppsSource.getFeatureById(selectedFeatureId);
    test.set('name', selectEl.value);
    alert(selectedFeatureId);
  }
});



//
// Define rotate to north control.
//

class DrawTerritoryControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};
    

    const button = document.createElement('button');
    button.innerHTML = '<i class="fa-solid fa-download"></i>'; //fa-draw-polygon

    const element = document.createElement('div');
    element.className = 'draw-territory ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleDrawTerritory.bind(this), false);
  }
  enabled = false;

  handleDrawTerritory() {
 /*   if(this.enabled && currentDraw) {
      currentDraw.finishDrawing();
      this.enabled = false;
      this.element.classList.remove("drawActive");
    } else {

      currentDraw = drawTerritory; 
      map.addInteraction(currentDraw);
      map.addInteraction(snap);
      this.enabled = true;
      this.element.classList.add("drawActive");
    }*/
    var format = new GeoJSON(); 
    var geoJsonStr = format.writeFeatures(planningAppsSource.getFeatures());

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(JSON.parse(geoJsonStr), null, 2));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "cities.json");
    dlAnchorElem.click();
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
styles['MajRoad'] = new Style({
  stroke: new Stroke({
    color: 'black',
    width: 2,
  }),
});

styles['Territory'] = new Style({
  stroke: new Stroke({
    color: 'red',
    width: 2,
    lineDash: [25, 5],
  }),
})

styles['City'] = new Style({
  image: new Circle({
    fill: new Fill({color: 'black'}),
    radius: 5,
  }),
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 1
    }),
    font: '14px serif',
    offsetY: -12
  })
})

const gj = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
          "name": "Wheloon",
          "styleTemplate": "City",
          "dynamicScale": [
            {"parameter": ["image", "radius"],
             "min": 5,
             "max": 25
            }
          ]
      },
      "geometry": {
        "type": "Point",
        "coordinates": [2381.5, 1705.5]
      },
    },
  ]
};


const wm_full = new ImageLayer({
  title: 'Faerun (GM)',
  type: 'base',
  visible: false,
  source: new Static({
    url: 'sourcemaps/faerun-detailed.png',
    projection: projection,
    imageExtent: extent,
  }),
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
});

const cormyr_labeled = new ImageLayer({
  title: 'Cormyr',
  source: new Static({
    url: 'sourcemaps/cormyr-labeled.png',
    projection: projection,
    imageExtent: extent2,
  }),
  minZoom: 3,
});

const wheloon = new ImageLayer({
  title: 'Wheloon',
  source: new Static({
    url: 'sourcemaps/wheloon.jpg',
    projection: projection,
    imageExtent: extent3,
  }),
  minZoom: 8,
});

const shadowdale = new ImageLayer({
  title: 'Shadowdale (GM)',
  source: new Static({
    url: 'sourcemaps/shadowdale-surrounding.jpg',
    projection: projection,
    imageExtent: extent4,
  }),
  minZoom: 8,
});

const shadowdale_rough = new ImageLayer({
  title: 'Shadowdale (Explored)',
  source: new Static({
    url: 'sourcemaps/shadowdale-bw.png',
    projection: projection,
    imageExtent: extent5,
  }),
  minZoom: 8,
});


const baseMaps = new LayerGroup({
  title: 'Continent',
  visible: true,
  layers: [wm_full, wm_rough],
});

const overlayMaps = new LayerGroup({
  title: 'Detail Maps',
  visible: true,
  layers: [cormyr_labeled, wheloon, shadowdale, shadowdale_rough],
});

const map = new Map({
  controls: defaultControls().extend([new DrawTerritoryControl(), new DrawCityControl()]),
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

var planningAppsSource = new VectorSource({
  features: new GeoJSON().readFeatures(gj),
});

// Create a vector layer to display the features within the GeoJSON source and
// applies a simple icon style to all features
var planningAppsLayer = new VectorLayer({
  title: 'marker',
  visible: true,
  source: planningAppsSource,
  style: function(feature, resolution){
    var baseStyle;
    if (styles[feature.get('styleTemplate')]) {
      baseStyle = styles[feature.get('styleTemplate')].clone();
    } else {
      baseStyle = new Style();
    }

    if (feature.get('dynamicScale')) {
      for (const params in feature.get('dynamicScale')) {

      }
    }
    

    var stroke = baseStyle.getStroke();
    if (stroke) {
      stroke.setWidth(stroke.getWidth()/resolution);
    

      var linedash = stroke.getLineDash();
      if(linedash) {
        stroke.setLineDash([linedash[0]/resolution, linedash[1]/resolution]);
      }
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

function buildStyle(feature, resolution){
  var style = new Style();


}

// Add the layer to the map
map.addLayer(planningAppsLayer);

map.getView().on('change:resolution', (event) => {
  console.log(event);
});

const select = new Select();

const modify = new Modify({
  features: select.getFeatures(),
});

const drawTerritory = new Draw({
  type: 'Polygon',
  source: planningAppsSource,
});

drawTerritory.on('drawend', function(event) {
  var fid = getUid(event.feature);
  
  event.feature.setId(fid);
  event.feature.set('styleTemplate', 'Territory');
  map.removeInteraction(drawTerritory);
  map.removeInteraction(snap);

  //favDialog.showModal();
})

const drawCity = new Draw({
  type: 'Point',
  source: planningAppsSource,
});

drawCity.on('drawend', function(event) {
  var fid = getUid(event.feature);
  
  event.feature.setId(fid);
  selectedFeatureId = fid;
  event.feature.set('name', "TestName");
  event.feature.set('styleTemplate', 'City');

  favDialog.showModal();

})

const snap = new Snap({
  source: planningAppsSource,
});


