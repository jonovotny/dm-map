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

const gj = {
  "type": "FeatureCollection",
  "features": [
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
      "id": "65"
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
        "styleTemplate": "City",
        "labelZoom": 4.5
      },
      "id": "70"
    },
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
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            1944.7018972186613,
            2409.180251880639
          ],
          [
            1957.0014499988486,
            2406.8899903284664
          ],
          [
            1974.5601218988402,
            2403.581834753106
          ],
          [
            1986.4355521693658,
            2402.0549937183237
          ],
          [
            1995.7662473819216,
            2399.0861361506923
          ],
          [
            2002.382558532643,
            2395.7779805753316
          ],
          [
            2009.00925238086,
            2392.778214927442
          ],
          [
            2009.9764232957239,
            2392.5666462898157
          ],
          [
            2011.0191544383113,
            2392.570424301202
          ],
          [
            2011.457403759109,
            2392.4646399823887
          ],
          [
            2016.9128522007609,
            2387.5721152372753
          ],
          [
            2022.2927404146903,
            2383.3558545302913
          ],
          [
            2029.909211369241,
            2379.744075645095
          ],
          [
            2045.4443941892393,
            2374.4246356133444
          ],
          [
            2061.5236106488487,
            2367.2917501162246
          ],
          [
            2072.1020425301704,
            2362.637240088443
          ],
          [
            2078.267757112427,
            2360.0984164369256
          ],
          [
            2086.2469171600524,
            2359.433486432957
          ],
          [
            2101.661203615693,
            2358.5872118824514
          ],
          [
            2112.7664554946414,
            2358.2072289733005
          ],
          [
            2138.8196220137825,
            2360.9273971713546
          ],
          [
            2168.318334917126,
            2366.1259408387473
          ]
        ]
      },
      "properties": {
        "styleTemplate": "MajorRoad",
        "name": "Way of the Manticore"
      },
      "id": "135"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            2016.9128522007609,
            2387.5721152372753
          ],
          [
            2018.0254749473843,
            2389.279003607188
          ],
          [
            2019.843015588304,
            2392.83436819425
          ],
          [
            2021.2011918409742,
            2396.5392696216827
          ],
          [
            2021.737604441561,
            2405.04524085956
          ],
          [
            2020.818039983412,
            2409.3876285785964
          ],
          [
            2018.7441123288559,
            2419.283767089704
          ],
          [
            2016.8794399553872,
            2427.942999070606
          ],
          [
            2016.138679697434,
            2432.6685386472054
          ],
          [
            2016.2539122205237,
            2438.9104219247934
          ],
          [
            2017.7354327364303,
            2443.4571573011963
          ],
          [
            2021.5924947692215,
            2451.758780881707
          ],
          [
            2025.6794479165499,
            2455.896820943377
          ],
          [
            2030.5071613218308,
            2460.545730148461
          ],
          [
            2033.6234630966687,
            2462.8957282081747
          ],
          [
            2039.7028059033198,
            2466.5995294979416
          ],
          [
            2048.540842084418,
            2470.3544177020494
          ],
          [
            2056.3315965215124,
            2471.810394760785
          ],
          [
            2063.8158294725577,
            2472.4489811900553
          ],
          [
            2068.6946297921804,
            2472.142459704006
          ],
          [
            2079.660723963999,
            2471.92279225945
          ],
          [
            2087.3668969840373,
            2471.8614816751274
          ],
          [
            2096.460367736843,
            2472.3468073613726
          ],
          [
            2102.156558685932,
            2471.989198960981
          ],
          [
            2107.086445919897,
            2469.7669181871215
          ],
          [
            2113.063614897864,
            2463.866379580667
          ]
        ]
      },
      "properties": {
        "styleTemplate": "MajorRoad",
        "name": "Thunder Way"
      },
      "id": "127"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            1944.7018972186613,
            2409.180251880639
          ],
          [
            1941.2108400912039,
            2418.789801828848
          ],
          [
            1940.4074406322295,
            2426.1989301727226
          ],
          [
            1940.5498794243615,
            2436.453567710815
          ],
          [
            1942.2905782521393,
            2442.077363923636
          ],
          [
            1945.0578430552732,
            2448.8169927183653
          ],
          [
            1947.1109750059854,
            2456.4046542753454
          ],
          [
            1948.3160741944469,
            2463.81378261922
          ],
          [
            1951.6189386368974,
            2475.775507897282
          ],
          [
            1952.9579377351881,
            2480.8190711675097
          ],
          [
            1954.8178528376648,
            2485.491108902853
          ],
          [
            1956.0376356612564,
            2491.4864306505583
          ],
          [
            1956.7071352104017,
            2504.742521723634
          ],
          [
            1956.5732353005726,
            2517.165457802219
          ],
          [
            1957.5551679726525,
            2525.1548190886865
          ],
          [
            1960.902665718379,
            2532.7871139489425
          ],
          [
            1965.276729439461,
            2538.8126098912503
          ],
          [
            1968.936660308122,
            2546.88627852835
          ],
          [
            1970.18639279986,
            2552.777874560829
          ],
          [
            1972.3287913571248,
            2560.1870029047036
          ],
          [
            1975.4084892831934,
            2565.944699027353
          ],
          [
            1979.2993272088206,
            2571.3292629717107
          ],
          [
            1981.888058798849,
            2575.8372266026226
          ],
          [
            1983.6733909299032,
            2581.2378562990616
          ],
          [
            1985.3694564544044,
            2588.9359265536195
          ],
          [
            1986.03895600355,
            2594.5597227664416
          ],
          [
            1985.5926229707861,
            2602.9233773681035
          ],
          [
            1986.6926284443884,
            2608.108488939528
          ],
          [
            1989.341820446,
            2617.9201672689583
          ],
          [
            1990.7700861508438,
            2627.159261047164
          ],
          [
            1990.7254528475673,
            2633.050857079643
          ],
          [
            1990.5915529377382,
            2637.291020890896
          ],
          [
            1993.314184437596,
            2642.780917193888
          ],
          [
            1995.5458496014137,
            2648.717146529643
          ],
          [
            1997.3311817324677,
            2655.8584750538594
          ],
          [
            1998.5362809209294,
            2659.9201056520074
          ],
          [
            2003.4013109780517,
            2665.588535168106
          ],
          [
            2011.3460389612426,
            2674.425929216824
          ],
          [
            2018.7998006083935,
            2680.362158552579
          ],
          [
            2025.2269962801884,
            2684.9593887900432
          ],
          [
            2028.3513275095331,
            2688.4854197488753
          ],
          [
            2034.4214567551169,
            2692.814850166683
          ],
          [
            2039.5989199351739,
            2694.1538492649734
          ],
          [
            2049.995854110136,
            2699.4520849127193
          ],
          [
            2062.091479298028,
            2707.4414461991864
          ],
          [
            2072.758838781076,
            2713.779375264429
          ],
          [
            2088.2912283212486,
            2722.7506692229763
          ],
          [
            2098.2890882551515,
            2729.758097837364
          ],
          [
            2103.0648517057216,
            2734.7123945010394
          ],
          [
            2108.688647918542,
            2742.7910223940594
          ],
          [
            2114.457033926061,
            2752.7617275932366
          ],
          [
            2116.019199540733,
            2758.430157109334
          ],
          [
            2118.6971977373146,
            2767.446084371157
          ],
          [
            2123.2497946715025,
            2778.2473437640347
          ],
          [
            2132.22108863005,
            2796.323831590958
          ],
          [
            2133.8278875479987,
            2802.617127352924
          ],
          [
            2134.7049708936174,
            2807.0701970498894
          ],
          [
            2135.0535504778745,
            2807.673507868796
          ],
          [
            2136.596627808943,
            2807.9315669627567
          ],
          [
            2138.09691838658,
            2808.518143015265
          ],
          [
            2139.732561051171,
            2809.7381715601646
          ],
          [
            2143.3926466858697,
            2815.100934394888
          ],
          [
            2151.383163309609,
            2826.3091087194616
          ],
          [
            2167.86737517367,
            2846.4085800475627
          ],
          [
            2171.2405769750867,
            2850.8067018520996
          ],
          [
            2174.67274518931,
            2863.516449770395
          ],
          [
            2178.7982773705917,
            2877.549141749009
          ],
          [
            2180.8361272477864,
            2888.3819226751507
          ],
          [
            2184.6973164887877,
            2905.6500190029615
          ],
          [
            2186.520655852594,
            2912.1925896613243
          ],
          [
            2198.747755115769,
            2925.3849862347492
          ],
          [
            2207.435430908021,
            2933.858151513612
          ],
          [
            2214.4656914290354,
            2940.113332027355
          ],
          [
            2228.4088747993173,
            2954.8073021944983
          ],
          [
            2236.453019051403,
            2958.346725665416
          ],
          [
            2257.3677941068254,
            2963.4949779867507
          ],
          [
            2267.3425329794118,
            2964.3530200403065
          ],
          [
            2281.7147373764715,
            2964.4602752970013
          ],
          [
            2287.292010724584,
            2963.923999013529
          ],
          [
            2297.4812601105596,
            2961.1353623394725
          ],
          [
            2307.348743726451,
            2957.917704638638
          ],
          [
            2311.59912645543,
            2975.9971787847176
          ]
        ]
      },
      "properties": {
        "styleTemplate": "MajorRoad",
        "name": "North Ride"
      },
      "id": "2802"
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            1986.6926284443884,
            2608.108488939528
          ],
          [
            2000.2340249539752,
            2609.791025447932
          ],
          [
            2015.2377304187878,
            2609.791025447932
          ],
          [
            2030.4119325366096,
            2608.5975488768677
          ],
          [
            2034.5038522088312,
            2609.620528794923
          ],
          [
            2051.0420275507267,
            2612.8599652020985
          ],
          [
            2067.409706239613,
            2618.997844710431
          ],
          [
            2082.9249016634535,
            2627.181684054874
          ],
          [
            2100.315560270395,
            2631.614597033114
          ],
          [
            2118.2177088363646,
            2639.1164497655204
          ],
          [
            2128.4475080169186,
            2651.903698741213
          ],
          [
            2137.4838306264082,
            2659.23505482061
          ],
          [
            2154.362999274322,
            2668.6123707361176
          ],
          [
            2165.6157783729313,
            2678.1601833046348
          ],
          [
            2177.5505440835777,
            2684.127566159958
          ],
          [
            2186.8072032697974,
            2691.430595517129
          ],
          [
            2193.2860760841486,
            2698.4209582905073
          ],
          [
            2203.515875264702,
            2714.106650367357
          ],
          [
            2209.142264814007,
            2718.539563345597
          ],
          [
            2225.339446849884,
            2725.1889328129573
          ],
          [
            2241.366132232752,
            2735.7597252995297
          ],
          [
            2252.6189113313617,
            2743.6025713379545
          ]
        ]
      },
      "properties": {
        "styleTemplate": "MajorRoad",
        "name": "Moonsea Ride"
      },
      "id": "328"
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

const cormyr_labeled = new ImageLayer({
  title: 'Cormyr',
  source: new Static({
    url: 'sourcemaps/cormyr-labeled.png',
    projection: projection,
    imageExtent: extent2,
  }),
  minZoom: 3,
  zIndex: 40,
  visible: false
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
  features: new GeoJSON().readFeatures(gj),
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

    /*if (feature.get('dynamicScale')) {
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
    }*/

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

    /*if (feature.get('dynamicScale')) {
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
    }*/

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
  layers: [roadsAndCities, cormyrMap, wheloon, shadowdale, shadowdale_rough, cormyr_labeled],
});

const map = new Map({
  controls: defaultControls().extend([new DrawRoadControl(), new DrawCityControl(), new DownloadGeoJsonControl()]),
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
});

styles['City'].getImage().setRadius(Math.max(Math.min(styles['City'].defaultRadius/map.getView().getResolution(), 8),3));
styles['MajorRoad'].getStroke().setWidth(Math.max(Math.min(styles['MajorRoad'].defaultWidth/map.getView().getResolution(), 4),0.5));

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


