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
import {singleClick, platformModifierKeyOnly} from 'ol/events/condition';
import {getUid} from 'ol/util';




const nameElement = document.getElementById('fname');
const typeElement = document.getElementById('ftype');
const tooltipElement = document.getElementById('ftooltip');
const popupElement = document.getElementById('fpopup');
var selectedFeatures = [];
var select = null;

var editableVectorSources = {};
//var drawElement = null;
//var snap = null;
var editMode = false;


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

    button_modify.addEventListener('click', this.handleModifyStart.bind(this), false);

    button_download.addEventListener('click', this.handleDownload.bind(this), false);
    
    dialog_style.addEventListener('close', this.handleStyleSelection.bind(this), false);
  }

  active = false;
  draw = false;
  interactions = [];

  handleStyleSelection() {
    if (selectedFeatures.length > 0) {
      if (selectedFeatures.length == 1) {
        var f = selectedFeatures[0];
        f.set('name', nameElement.value);
        f.set('styleTemplate', typeElement.value);
        f.set('tooltip', tooltipElement.value)
        f.set('popup', popupElement.value)
      } else {
        selectedFeatures.forEach(function(f){
          f.set('styleTemplate', typeElement.value);
        });
      }
    }
  }

  clearInteractions() {
    this.interactions.forEach(function(inter) {
      map.removeInteraction(inter);
    });
    this.interactions = [];
  }

  addInteraction(inter) {
    map.addInteraction(inter);
    this.interactions.push(inter);
  }

  ctrlClickOverride(event) {
    if(select.getFeatures().getArray().length > 0 && platformModifierKeyOnly(event)) {
      selectedFeatures = select.getFeatures().getArray();
      if (selectedFeatures.length > 1 ) {
        nameElement.disabled = true;
        tooltipElement.disabled =true;
        popupElement.disabled =true; 

        nameElement.value = "*";
        typeElement.value = selectedFeatures[0].get('styleTemplate');
        tooltipElement.value = "*";
        popupElement.value = "*";
      } else {
        nameElement.disabled = false;
        tooltipElement.disabled = false;
        popupElement.disabled = false;

        nameElement.value = selectedFeatures[0].get('name') || "";
        typeElement.value = selectedFeatures[0].get('styleTemplate');
        tooltipElement.value = selectedFeatures[0].get('tooltip') || " ";
        popupElement.value = selectedFeatures[0].get('popup') || " ";
      }
    
      dialog_style.showModal();
    } 
  }

  handleOpenMenu() {
    if (this.draw) {
      button_edit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
      button_edit.defaultStyle = null;

      this.clearInteractions();
      select = null;
      selectedFeatures =[];
      editMode = false;
      this.draw = false;
      map.un('click', this.ctrlClickOverride);
      editableVectorSources[select_layer.value].changed();
      
    } else {
      if (!this.active) {
        var children = Array.from(this.element.childNodes);
        children.forEach(function(child){
          child.classList.remove("hiddenElement");
        });

        if(!select_layer.options.length) {
          Object.keys(editableVectorSources).forEach(function(layerName){
            var opt = document.createElement('option');
            opt.value = layerName;
            opt.text = layerName;
            select_layer.options.add(opt);
          });
          select_layer.value = select_layer.options[0].value;
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
      this.closeMenu();
      this.clearInteractions();
      this.draw = false;  
    } else {
      button_edit.innerHTML = event.currentTarget.innerHTML;
      button_edit.defaultStyle = event.currentTarget.defaultStyle;
      this.closeMenu();
      this.clearInteractions();
      
      var drawElement = new Draw({
        type: event.currentTarget.drawType,
        source: editableVectorSources[select_layer.value]});

      drawElement.on('drawend',this.handleDrawEnd);
      this.addInteraction(drawElement);

      this.addInteraction(new Snap({
        source: editableVectorSources[select_layer.value]}));

      this.draw = true;
    }
  }


  handleDrawEnd(event) {
    selectedFeatures = [event.feature];
    event.feature.set('styleTemplate', button_edit.defaultStyle);
  
    dialog_style.showModal();
  }

  handleModifyStart(event) {
    button_edit.innerHTML = event.currentTarget.innerHTML;
    button_edit.defaultStyle = event.currentTarget.defaultStyle;
    this.closeMenu();
    this.clearInteractions();
      
    select = new Select({
      wrapX: false,
      condition: function (e) {
        return (singleClick(e) && !platformModifierKeyOnly(e));
      },
    });

    map.on('click', this.ctrlClickOverride)
    this.addInteraction(select);

    this.addInteraction(new Modify({
      features: select.getFeatures(),
    }));
    editMode = true;
    this.draw = true;
    editableVectorSources[select_layer.value].changed();
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

styles['Marker'] = new Style({
  image: new Circle({
    fill: new Fill({color: 'black'}),
    stroke: new Stroke({
      color: 'white',
      width: 1
    }),
    radius: 6,
  })
})
styles['Marker'].defaultRadius = 6;
stylesLabel['Marker'] = new Style({
  text: new Text({
    stroke: new Stroke({
      color: 'white',
      width: 3
    }),
    font: '900 16px "Font Awesome 6 Free"',
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
  zIndex: 10,
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
  zIndex: 10,
});

const heartlands_pc = new ImageLayer({
  title: 'Western Heartlands (Players)',
  source: new Static({
    url: 'sourcemaps/cormyr-unlabeled.png',
    projection: projection,
    imageExtent: extent2,
  }),
  minZoom: 3,
  zIndex: 100,
});

const shadowdale_gm = new ImageLayer({
  title: 'Shadowdale (GM)',
  source: new Static({
    url: 'sourcemaps/shadowdale-surrounding.jpg',
    projection: projection,
    imageExtent: extent4,
  }),
  minZoom: 8,
  zIndex: 190,
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
  zIndex: 200
});

const wheloon_pc = new ImageLayer({
  title: 'wheloon',
  source: new Static({
    url: 'sourcemaps/wheloon.jpg',
    projection: projection,
    imageExtent: extent3,
  }),
  minZoom: 8,
  zIndex: 200,
});

//Vector Sources

var heartlands_pc_src = new VectorSource({
  format: new GeoJSON(),
  url: 'sourcemaps/western-heartlands-markers.geojson'
});

var shadowdale_pc_src = new VectorSource({
  format: new GeoJSON(),
  url: 'sourcemaps/shadowdale-markers.geojson'
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
  minZoom: 3,
  zIndex: 110,
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
  minZoom: 3,
  zIndex: 120,
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
  zIndex: 210,
  minZoom: 12,
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
  zIndex: 220,
  declutter: true,
});

//Layer Groups

const baseMaps = new LayerGroup({
  title: 'Continent',
  visible: true,
  layers: [faerun_gm, faerun_pc],
  zIndex: 20,
});

const heartlands_pc_lg = new LayerGroup({
  title: 'Eastern Heartlands',
  visible: true,
  combine: true,
  zIndex: 120,
  layers: [heartlands_pc, heartlands_pc_markers, heartlands_pc_labels],
});

const shadowdale_pc_lg = new LayerGroup({
  title: 'Shadowdale (Players)',
  visible: true,
  combine: true,
  zIndex: 220,
  layers: [shadowdale_pc, shadowdale_pc_markers, shadowdale_pc_labels],
});

const overlayMaps = new LayerGroup({
  title: 'Local Maps',
  visible: true,
  layers: [heartlands_pc_lg, wheloon_pc, shadowdale_gm, shadowdale_pc_lg],
});

editableVectorSources['Western Heartlands (Players)'] = heartlands_pc_src;
editableVectorSources['Shadowdale (Players)'] = shadowdale_pc_src;

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

map.getView().on('change:resolution', (event) => {
  styles['City'].getImage().setRadius(Math.max(Math.min(styles['City'].defaultRadius/event.oldValue, 8),3));
  styles['MajorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MajorRoad'].defaultWidth/event.oldValue, 4),0.5));
  styles['MinorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MinorRoad'].defaultWidth/event.oldValue, 3),0.25));
});

styles['City'].getImage().setRadius(Math.max(Math.min(styles['City'].defaultRadius/map.getView().getResolution(), 8),3));
styles['MajorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MajorRoad'].defaultWidth/map.getView().getResolution(), 4),0.5));
styles['MinorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MinorRoad'].defaultWidth/map.getView().getResolution(), 3),0.25));



