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
    radius: 6,
  }),
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 2
    }),
    font: '16px serif',
    offsetY: -12
  })
})

const gj = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2079.660723963999,
          2471.92279225945
        ]
      },
      "properties": {
        "name": "Thunder Stone",
        "styleTemplate": "City"
      },
      "id": "80"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2088.3528355788962,
          2901.491151079794
        ]
      },
      "properties": {
        "name": "Daggerfall",
        "styleTemplate": "City"
      },
      "id": "95"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2136.596627808943,
          2807.9315669627567
        ]
      },
      "properties": {
        "name": "Shadowdale",
        "styleTemplate": "City"
      },
      "id": "100"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2311.59912645543,
          2975.9971787847176
        ]
      },
      "properties": {
        "name": "Zenthil Keep",
        "styleTemplate": "City"
      },
      "id": "105"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          1899.8693700833057,
          2359.54403335142
        ]
      },
      "properties": {
        "name": "Suzail",
        "styleTemplate": "City"
      },
      "id": "70"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          1946.762836192409,
          2360.2883740833104
        ]
      },
      "properties": {
        "name": "Marsember",
        "styleTemplate": "City"
      },
      "id": "65"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          1954.8178528376648,
          2485.491108902853
        ]
      },
      "properties": {
        "name": "Arabel",
        "styleTemplate": "City"
      },
      "id": "85"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          1986.6926284443884,
          2608.108488939528
        ]
      },
      "properties": {
        "name": "Tilverton",
        "styleTemplate": "City"
      },
      "id": "90"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2010.0394666841057,
          2392.7059664175918
        ]
      },
      "properties": {
        "name": "Wheloon",
        "styleTemplate": "City"
      },
      "id": "75"
    }
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
    url: 'sourcemaps/cormyr-unlabeled.png',
    projection: projection,
    imageExtent: extent2,
  }),
  minZoom: 3,
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
    url: 'sourcemaps/shadowdale-sepia.png',
    projection: projection,
    imageExtent: extent5,
  }),
  minZoom: 8,
});

var planningAppsSource = new VectorSource({
  features: new GeoJSON().readFeatures(gj),
});

// Create a vector layer to display the features within the GeoJSON source and
// applies a simple icon style to all features
var planningAppsLayer = new VectorLayer({
  title: 'marker',
  visible: true,
  source: planningAppsSource,
  zIndex: 10,
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

const cormyrMap = new LayerGroup({
  title: 'Eastern Heartlands',
  visible: true,
  combine: true,
  zIndex: 10,
  layers: [cormyr_labeled, planningAppsLayer],
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
  layers: [cormyrMap, wheloon, shadowdale, shadowdale_rough],
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





function buildStyle(feature, resolution){
  var style = new Style();


}

// Add the layer to the map
//map.addLayer(planningAppsLayer);

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


