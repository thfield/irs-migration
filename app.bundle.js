/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

// import * as d3 from 'd3'
// import 'd3-queue'
// import * as d3Legend from 'd3-svg-legend'
// import * as topojson from 'topojson'
// import {dimple} from 'dimple'
// import barChart from '../charts/bar-chart.js'

// TODO: better state management
// TODO: get dimple & webpack working correctly
// TODO: county lineshapes transition to circles
// TODO: map tooltip follow mouse
// TODO: map zooming
// TODO: net flow in-out
// TODO: state flow: in, out, delta
// TODO: total number of counties
// TODO: change chart colors on im/em-igrate direction change
// TODO: dimple doesn't seem to handle elements in selection.exit() properly
//     - throws `Error: <rect> attribute x: Expected length, "NaN".` on redraw
// TODO: use miso for data grouping? http://misoproject.com/dataset/
//     -re-munge data to contain column 'direction' = in||out

var fipsCounty = '06075';
var year = '1415';
var direction = document.querySelector('#direction').value;

var colorSwatches = {
  in: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  out: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
};

colorSwatches.chart = {
  in: new dimple.color(colorSwatches.in[6]),
  out: new dimple.color(colorSwatches.out[6])
};

var path = '../data';
var dataPath = path + '/' + fipsCounty + '/' + fipsCounty + 'combined.csv';
var chartPath = path + '/chartData.json';
var shapesPath = path + '/' + fipsCounty + '/' + fipsCounty + 'shapes.topojson';
var statesPath = path + '/geo/states.topojson';
var fipsPath = path + '/fipscodes.csv';

d3.queue().defer(d3.csv, dataPath, function (row) {
  var meanAgi = +row.agi / +row.n1;
  return Object.assign(row, { meanAgi: meanAgi });
}).defer(d3.json, chartPath).defer(d3.json, statesPath).defer(d3.json, shapesPath).defer(d3.csv, fipsPath, function (row) {
  return Object.assign(row, { id: row.statefp.concat(row.countyfp) });
}).await(initialDraw);

function initialDraw(error, data, chartData, us, counties, fips) {
  if (error) {
    throw error;
  }
  /**
    * fipsMap has mapping of:
    *  - state fips to state abbrev:
    *     {'06': 'CA'}
    *  - state+county fips to county data from d3.csvParse(fipscodes.csv):
    *      { '06075': {
    *          id: '06075',
    *          state: 'CA',
    *          statefp: '06',
    *          countyfp: '075',
    *          name: 'San Francisco County',
    *          type: 'H1
    *        }
    *      }
    */
  var fipsMap = new Map();
  fips.forEach(function (row) {
    fipsMap.set(row.id, row);
    fipsMap.set(row.statefp, row.state);
  });

  /**
   * nestedCountyData nests data from d3.csvParse(00000combined.csv) by:
   *   -direction: ['in', 'out']
   *     -year: ['0405', ..., '1415']
   *        -array of
   *          -data: {agi,id,n1,n2,y1_countyfips,y1_statefips,y2_countyfips,y2_statefips,year}
   */
  var nestedCountyData = d3.nest().key(inOrOut).key(function (d) {
    return d.year;
  }).object(data);

  /* *** set color scale *** */
  var color = d3.scaleQuantile().range(colorSwatches[direction]).domain(domainVals(nestedCountyData, direction, year, 'n1'));

  /* *** populate year selector *** */
  var years = Object.keys(nestedCountyData[direction]).sort();
  var yearSelector = document.getElementById('year-selector');
  yearSelector.max = years.length - 1;
  yearSelector.value = years.length - 1;
  document.getElementById('selected-year').innerHTML = fullYear(years[years.length - 1]);

  /* *** populate state selector *** */
  var states = Object.keys(chartData.charts.linechart[direction]);
  var stateSelector = d3.select('#stateyear');
  stateSelector.selectAll('.stateoptions').data(states).enter().append('option').attr('value', function (d) {
    return d;
  }).text(function (d) {
    return d;
  });

  /* *** start map drawing *** */
  var mapSvg = d3.select('#map svg');
  var path = d3.geoPath();
  var tooltip = d3.select('#tooltip');

  /* *** draw legend *** */
  mapSvg.append('g').attr('class', 'legendQuant').attr('transform', 'translate(830,300)');
  var legend = d3.legendColor().labelFormat(d3.format(',d')).title('').titleWidth(100).cells(7).scale(color);
  mapSvg.select('.legendQuant').call(legend);

  /* *** draw counties *** */
  var countymapel = mapSvg.append('g').attr('class', 'counties');
  countymapel.selectAll('path').data(topojson.feature(counties, counties.objects.counties).features).enter().append('path').attr('stroke', '#fff').attr('stroke-width', 0.5).attr('fill', function (d) {
    var num = getVal(d.properties.geoid, year, direction);
    return num === null ? '#fff' : color(num);
  }).attr('id', function (d) {
    return d.geoid;
  }).attr('d', path).on('mouseover', ttOver).on('mousemove', ttMove).on('mouseout', ttOut);

  /* *** draw states *** */
  mapSvg.append('path').attr('stroke-width', 0.5).attr('d', path(topojson.mesh(us, us.objects.states)));

  /** @function getVal
   * @param {string} geoid - id = `${statefips}${countyfips}`
   * @param {string} year - one of ['0405', ..., '1415']
   * @param {string} direction - 'in'||'out'
   * @param {string} stat - one of ['n1', 'n2', 'agi']
   * @returns {?number}
   * @description Returns either the value for the record with id=geoid or null
   */
  function getVal(geoid, year, direction) {
    var stat = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'n1';

    var val = nestedCountyData[direction][year].find(function (el) {
      return el.id === geoid;
    });
    return val === undefined ? null : val[stat];
  }

  /* *** tooltip handler functions *** */
  function ttOver(d) {
    d3.select(this).classed('highlight', true);
  }
  function ttMove(d) {
    var stat = document.getElementById('stat').value;
    tooltip.style('left', d3.event.pageX - 50 + 'px').style('top', d3.event.pageY - 70 + 'px').style('display', 'inline-block').html('<strong>' + d.properties.name + ', ' + d.properties.state + '</strong>: <span>' + getVal(d.properties.geoid, year, direction, stat) + '</span>');
  }
  function ttOut(d) {
    tooltip.style('display', 'none');
    d3.select(this).classed('highlight', false);
  }
  /* *** end map drawing *** */

  /* *** start draw the counties barchart *** */
  var topCountyElement = dimple.newSvg('#rank-county', 960, 400);
  var topCountyChart = new dimple.chart(topCountyElement, chartData.counties.n1[direction][year]);
  topCountyChart.setMargins(50, 30, 30, 150);
  topCountyChart.addCategoryAxis('x', 'name').title = 'County';
  var topCountyChartY = topCountyChart.addMeasureAxis('y', 'value');
  topCountyChartY.title = statFullName['n1'];
  // topCountyChart.defaultColors = [colorSwatches.chart[direction]]
  topCountyChart.addSeries(null, dimple.plot.bar);
  topCountyChart.draw();
  /* *** end draw the counties barchart *** */

  /* *** start draw the out of state counties barchart *** */
  var topCountyOutOfStateElement = dimple.newSvg('#rank-county-outofstate', 960, 400);
  var topCountyOutOfStateChart = new dimple.chart(topCountyOutOfStateElement, chartData.counties.outOfState.n1[direction][year]);
  topCountyOutOfStateChart.setMargins(50, 30, 30, 150);
  topCountyOutOfStateChart.addCategoryAxis('x', 'name').title = 'County';
  var topCountyOutOfStateChartY = topCountyOutOfStateChart.addMeasureAxis('y', 'value');
  topCountyOutOfStateChartY.title = statFullName['n1'];
  // topCountyOutOfStateChart.defaultColors = [colorSwatches.chart[direction]]
  topCountyOutOfStateChart.addSeries(null, dimple.plot.bar);
  topCountyOutOfStateChart.draw();
  /* *** end draw the counties barchart *** */

  /* *** start draw the states barchart *** */
  var topStateElement = dimple.newSvg('#rank-state', 960, 400);
  var topStateChart = new dimple.chart(topStateElement, chartData.states.n1[direction][year].filter(function (d) {
    return d.fips !== '06';
  }));
  topStateChart.setMargins(50, 30, 30, 150);
  topStateChart.addCategoryAxis('x', 'name').title = 'State';
  // let topStateChartY = topStateChart.addLogAxis('y', 'value')
  var topStateChartY = topStateChart.addMeasureAxis('y', 'value');
  topStateChartY.title = statFullName['n1'];
  // topStateChart.defaultColors = [colorSwatches.chart[direction]]
  topStateChart.addSeries(null, dimple.plot.bar);
  topStateChart.draw();
  /* *** end draw the states barchart *** */

  /* *** start draw the linechart *** */
  var annualData = chartData.charts.linechart[direction].CA.map(function (d) {
    return { year: d.year, value: d[document.getElementById('stat').value] };
  });
  var annualElement = dimple.newSvg('#annual', 960, 400);
  var annualChart = new dimple.chart(annualElement, annualData);
  annualChart.setMargins(70, 0, 50, 40);
  annualChart.addCategoryAxis('x', 'year').title = 'Year';
  var annualChartY = annualChart.addAxis('y', 'value');
  annualChartY.title = statFullName['n1'];
  annualChart.addSeries(null, dimple.plot.line);
  // annualChart.defaultColors = [colorSwatches.chart[direction]]
  annualChart.draw();
  /* *** end draw the linechart *** */

  /* *** begin page interaction handlers *** */
  stateSelector.on('change', function () {
    var stat = document.getElementById('stat').value;
    annualChart.data = chartData.charts.linechart[direction][this.value].map(function (d) {
      return { year: d.year, value: d[stat] };
    });
    annualChart.draw();
  });
  yearSelector.addEventListener('change', function () {
    document.getElementById('selected-year').innerHTML = fullYear(years[this.value]);
    changeInput(years[this.value], null, null);
  });
  document.getElementById('direction').addEventListener('change', function () {
    changeInput(null, this.value, null);
  });
  document.getElementById('stat').addEventListener('change', function () {
    changeInput(null, null, this.value);
  });

  function changeInput(year, direction, stat) {
    var nostateupdate = false;
    if (year) {
      nostateupdate = true;
    }
    year = year || years[yearSelector.value];
    direction = direction || document.querySelector('#direction').value;
    stat = stat || document.querySelector('#stat').value;
    var state = document.querySelector('#stateyear').value;

    color.domain(domainVals(nestedCountyData, direction, year, stat)).range(colorSwatches[direction]);

    countymapel.selectAll('path').attr('fill', function (d) {
      var num = getVal(d.properties.geoid, year, direction, stat);
      return color(num);
    });

    mapSvg.select('.legendCells').remove(); // update doesn't seem to call a color change on the legend
    legend.scale(color);
    mapSvg.select('.legendQuant').call(legend);

    // topCountyChart.defaultColors = [colorSwatches.chart[direction]] // use colorScale instead of defaultColors?
    topCountyChart.data = chartData.counties[stat][direction][year];
    topCountyChartY.title = statFullName[stat];
    topCountyChart.draw();

    topStateChart.data = chartData.states[stat][direction][year].filter(function (d) {
      return d.fips !== '06';
    });
    // topStateChart.defaultColors = [colorSwatches.chart[direction]]
    topStateChartY.title = statFullName[stat];
    topStateChart.draw();

    topCountyOutOfStateChart.data = chartData.counties.outOfState[stat][direction][year];
    // topCountyOutOfStateChart.defaultColors = [colorSwatches.chart[direction]]
    topCountyOutOfStateChartY.title = statFullName[stat];
    topCountyOutOfStateChart.draw();

    if (!nostateupdate) {
      annualChart.data = chartData.charts.linechart[direction][state].map(function (d) {
        return { year: d.year, value: d[stat] };
      });
      annualChartY.title = statFullName[stat];
      // annualChart.defaultColors = [colorSwatches.chart[direction]]
      annualChart.draw();
    }
  }
  /* *** end page interaction handlers *** */
} /* *** end initialDraw *** */

/*******************************************************************************
        data munge helper functions
*******************************************************************************/
/** @function domainVals
 * @param {object} data - nestedCountyData
 * @param {string} direction - 'in'||'out'
 * @param {string} year - one of ['0405', ..., '1415']
 * @param {string} stat - one of ['n1', 'n2', 'agi', 'meanAgi']
 * @returns {array} array of stat values for the data in that direction & year
 */
function domainVals(data, direction, year, stat) {
  return data[direction][year].map(function (d) {
    return d.y1_statefips < 58 && d.id !== fipsCounty && d[stat] !== '-1' ? +d[stat] : null;
  });
}

/** @function inOrOut
 * @param { object } d - d3.csvParse'd row of data from `000000combined.csv` file
 * @returns { string } 'in' or 'out', meaning 'immigration into' or
 * 'emigration out of' the county of interest
 */
function inOrOut(d) {
  return d.id === '' + d.y1_statefips + d.y1_countyfips ? 'in' : 'out';
}

/** @function fullYear
 * @param { string } d - ex: '0405'
 * @returns { string } - ex: '2004-2005'
 * @description formats 2digit/2years string into 4digit/2years with hyphen
 */
function fullYear(d) {
  var res = /(\d{2})(\d{2})/.exec(d);
  res[1] = res[1] > 79 ? '19' + res[1] : '20' + res[1];
  res[2] = res[2] > 79 ? '19' + res[2] : '20' + res[2];
  return res[1] + '-' + res[2];
}

var statFullName = {
  n1: 'Number of Returns',
  n2: 'Number of Exemptions',
  agi: 'Total Adjusted Gross Income',
  meanAgi: 'Mean Adjusted Gross Income'
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(2);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!./style.css", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!./style.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(undefined);
// imports


// module
exports.push([module.i, "body {\n    padding: 0;\n    margin: 0;\n}\n\n#sidebar {\n    position: fixed;\n    top: 0px;\n    left: 0px;\n    bottom: 0px;\n    width: 200px;\n    margin-top: 50px;\n    margin-left: 10px;\n}\n\n#container {\n    margin-top: 50px;\n    margin-left: 250px;\n}\n\n#year-selector {\n   width: 200px;\n}\n\n.highlight {\n  fill: #ac2ee7;\n  /*stroke: #f00;\n  stroke-width: 2px;*/\n}\n\n.legendCells {\n  fill: #000;\n  stroke: none;\n}\n\n.axis path,\n.axis line {\n  fill: none;\n  stroke: black;\n  shape-rendering: crispEdges;\n}\n.axis text {\n  font-family: sans-serif;\n  font-size: 12px;\n}\n\n.selector-control {\n  margin-top: 0.5rem;\n}\n\n#selected-year {\n  border: 1px #787676 solid;\n  padding: 3px;\n  margin: 0 2px;\n  border-radius: 4px;\n}\n\n.tooltip {\n  position: absolute;\n  display: none;\n  min-width: 80px;\n  height: auto;\n  background: none repeat scroll 0 0 #ffffff;\n  border: 1px solid #777;\n  border-radius: 5px;\n  padding: 10px;\n  text-align: center;\n}", ""]);

// exports


/***/ }),
/* 3 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			memo[selector] = fn.call(this, selector);
		}

		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(5);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 5 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMTUwNGZhZWY3ZTg3Y2JiYjI3ZWYiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9zdHlsZS5jc3M/YmQ4NCIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGUuY3NzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXMuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9saWIvdXJscy5qcyJdLCJuYW1lcyI6WyJmaXBzQ291bnR5IiwieWVhciIsImRpcmVjdGlvbiIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsInZhbHVlIiwiY29sb3JTd2F0Y2hlcyIsImluIiwib3V0IiwiY2hhcnQiLCJkaW1wbGUiLCJjb2xvciIsInBhdGgiLCJkYXRhUGF0aCIsImNoYXJ0UGF0aCIsInNoYXBlc1BhdGgiLCJzdGF0ZXNQYXRoIiwiZmlwc1BhdGgiLCJkMyIsInF1ZXVlIiwiZGVmZXIiLCJjc3YiLCJyb3ciLCJtZWFuQWdpIiwiYWdpIiwibjEiLCJPYmplY3QiLCJhc3NpZ24iLCJqc29uIiwiaWQiLCJzdGF0ZWZwIiwiY29uY2F0IiwiY291bnR5ZnAiLCJhd2FpdCIsImluaXRpYWxEcmF3IiwiZXJyb3IiLCJkYXRhIiwiY2hhcnREYXRhIiwidXMiLCJjb3VudGllcyIsImZpcHMiLCJmaXBzTWFwIiwiTWFwIiwiZm9yRWFjaCIsInNldCIsInN0YXRlIiwibmVzdGVkQ291bnR5RGF0YSIsIm5lc3QiLCJrZXkiLCJpbk9yT3V0IiwiZCIsIm9iamVjdCIsInNjYWxlUXVhbnRpbGUiLCJyYW5nZSIsImRvbWFpbiIsImRvbWFpblZhbHMiLCJ5ZWFycyIsImtleXMiLCJzb3J0IiwieWVhclNlbGVjdG9yIiwiZ2V0RWxlbWVudEJ5SWQiLCJtYXgiLCJsZW5ndGgiLCJpbm5lckhUTUwiLCJmdWxsWWVhciIsInN0YXRlcyIsImNoYXJ0cyIsImxpbmVjaGFydCIsInN0YXRlU2VsZWN0b3IiLCJzZWxlY3QiLCJzZWxlY3RBbGwiLCJlbnRlciIsImFwcGVuZCIsImF0dHIiLCJ0ZXh0IiwibWFwU3ZnIiwiZ2VvUGF0aCIsInRvb2x0aXAiLCJsZWdlbmQiLCJsZWdlbmRDb2xvciIsImxhYmVsRm9ybWF0IiwiZm9ybWF0IiwidGl0bGUiLCJ0aXRsZVdpZHRoIiwiY2VsbHMiLCJzY2FsZSIsImNhbGwiLCJjb3VudHltYXBlbCIsInRvcG9qc29uIiwiZmVhdHVyZSIsIm9iamVjdHMiLCJmZWF0dXJlcyIsIm51bSIsImdldFZhbCIsInByb3BlcnRpZXMiLCJnZW9pZCIsIm9uIiwidHRPdmVyIiwidHRNb3ZlIiwidHRPdXQiLCJtZXNoIiwic3RhdCIsInZhbCIsImZpbmQiLCJlbCIsInVuZGVmaW5lZCIsImNsYXNzZWQiLCJzdHlsZSIsImV2ZW50IiwicGFnZVgiLCJwYWdlWSIsImh0bWwiLCJuYW1lIiwidG9wQ291bnR5RWxlbWVudCIsIm5ld1N2ZyIsInRvcENvdW50eUNoYXJ0Iiwic2V0TWFyZ2lucyIsImFkZENhdGVnb3J5QXhpcyIsInRvcENvdW50eUNoYXJ0WSIsImFkZE1lYXN1cmVBeGlzIiwic3RhdEZ1bGxOYW1lIiwiYWRkU2VyaWVzIiwicGxvdCIsImJhciIsImRyYXciLCJ0b3BDb3VudHlPdXRPZlN0YXRlRWxlbWVudCIsInRvcENvdW50eU91dE9mU3RhdGVDaGFydCIsIm91dE9mU3RhdGUiLCJ0b3BDb3VudHlPdXRPZlN0YXRlQ2hhcnRZIiwidG9wU3RhdGVFbGVtZW50IiwidG9wU3RhdGVDaGFydCIsImZpbHRlciIsInRvcFN0YXRlQ2hhcnRZIiwiYW5udWFsRGF0YSIsIkNBIiwibWFwIiwiYW5udWFsRWxlbWVudCIsImFubnVhbENoYXJ0IiwiYW5udWFsQ2hhcnRZIiwiYWRkQXhpcyIsImxpbmUiLCJhZGRFdmVudExpc3RlbmVyIiwiY2hhbmdlSW5wdXQiLCJub3N0YXRldXBkYXRlIiwicmVtb3ZlIiwieTFfc3RhdGVmaXBzIiwieTFfY291bnR5ZmlwcyIsInJlcyIsImV4ZWMiLCJuMiJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7O0FDN0RBOztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFJQSxhQUFhLE9BQWpCO0FBQ0EsSUFBSUMsT0FBTyxNQUFYO0FBQ0EsSUFBSUMsWUFBWUMsU0FBU0MsYUFBVCxDQUF1QixZQUF2QixFQUFxQ0MsS0FBckQ7O0FBRUEsSUFBSUMsZ0JBQWdCO0FBQ2xCQyxNQUFJLENBQUMsU0FBRCxFQUFZLFNBQVosRUFBdUIsU0FBdkIsRUFBa0MsU0FBbEMsRUFBNkMsU0FBN0MsRUFBd0QsU0FBeEQsRUFBbUUsU0FBbkUsRUFBOEUsU0FBOUUsRUFBeUYsU0FBekYsQ0FEYztBQUVsQkMsT0FBSyxDQUFDLFNBQUQsRUFBWSxTQUFaLEVBQXVCLFNBQXZCLEVBQWtDLFNBQWxDLEVBQTZDLFNBQTdDLEVBQXdELFNBQXhELEVBQW1FLFNBQW5FLEVBQThFLFNBQTlFLEVBQXlGLFNBQXpGO0FBRmEsQ0FBcEI7O0FBS0FGLGNBQWNHLEtBQWQsR0FBc0I7QUFDcEJGLE1BQUksSUFBSUcsT0FBT0MsS0FBWCxDQUFpQkwsY0FBY0MsRUFBZCxDQUFpQixDQUFqQixDQUFqQixDQURnQjtBQUVwQkMsT0FBSyxJQUFJRSxPQUFPQyxLQUFYLENBQWlCTCxjQUFjRSxHQUFkLENBQWtCLENBQWxCLENBQWpCO0FBRmUsQ0FBdEI7O0FBS0EsSUFBSUksT0FBTyxTQUFYO0FBQ0EsSUFBSUMsV0FBY0QsSUFBZCxTQUFzQlosVUFBdEIsU0FBb0NBLFVBQXBDLGlCQUFKO0FBQ0EsSUFBSWMsWUFBZUYsSUFBZixvQkFBSjtBQUNBLElBQUlHLGFBQWdCSCxJQUFoQixTQUF3QlosVUFBeEIsU0FBc0NBLFVBQXRDLG9CQUFKO0FBQ0EsSUFBSWdCLGFBQWdCSixJQUFoQix5QkFBSjtBQUNBLElBQUlLLFdBQWNMLElBQWQsbUJBQUo7O0FBRUFNLEdBQUdDLEtBQUgsR0FDR0MsS0FESCxDQUNTRixHQUFHRyxHQURaLEVBQ2lCUixRQURqQixFQUMyQixVQUFVUyxHQUFWLEVBQWU7QUFDdEMsTUFBSUMsVUFBVSxDQUFDRCxJQUFJRSxHQUFMLEdBQVcsQ0FBQ0YsSUFBSUcsRUFBOUI7QUFDQSxTQUFPQyxPQUFPQyxNQUFQLENBQWNMLEdBQWQsRUFBbUIsRUFBQ0MsU0FBU0EsT0FBVixFQUFuQixDQUFQO0FBQ0QsQ0FKSCxFQUtHSCxLQUxILENBS1NGLEdBQUdVLElBTFosRUFLa0JkLFNBTGxCLEVBTUdNLEtBTkgsQ0FNU0YsR0FBR1UsSUFOWixFQU1rQlosVUFObEIsRUFPR0ksS0FQSCxDQU9TRixHQUFHVSxJQVBaLEVBT2tCYixVQVBsQixFQVFHSyxLQVJILENBUVNGLEdBQUdHLEdBUlosRUFRaUJKLFFBUmpCLEVBUTJCLFVBQVVLLEdBQVYsRUFBZTtBQUN0QyxTQUFPSSxPQUFPQyxNQUFQLENBQWNMLEdBQWQsRUFBbUIsRUFBQ08sSUFBSVAsSUFBSVEsT0FBSixDQUFZQyxNQUFaLENBQW1CVCxJQUFJVSxRQUF2QixDQUFMLEVBQW5CLENBQVA7QUFDRCxDQVZILEVBV0dDLEtBWEgsQ0FXU0MsV0FYVDs7QUFhQSxTQUFTQSxXQUFULENBQXNCQyxLQUF0QixFQUE2QkMsSUFBN0IsRUFBbUNDLFNBQW5DLEVBQThDQyxFQUE5QyxFQUFrREMsUUFBbEQsRUFBNERDLElBQTVELEVBQWtFO0FBQ2hFLE1BQUlMLEtBQUosRUFBVztBQUFFLFVBQU1BLEtBQU47QUFBYTtBQUMxQjs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsTUFBSU0sVUFBVSxJQUFJQyxHQUFKLEVBQWQ7QUFDQUYsT0FBS0csT0FBTCxDQUFhLFVBQVVyQixHQUFWLEVBQWU7QUFDMUJtQixZQUFRRyxHQUFSLENBQVl0QixJQUFJTyxFQUFoQixFQUFvQlAsR0FBcEI7QUFDQW1CLFlBQVFHLEdBQVIsQ0FBWXRCLElBQUlRLE9BQWhCLEVBQXlCUixJQUFJdUIsS0FBN0I7QUFDRCxHQUhEOztBQUtBOzs7Ozs7O0FBT0EsTUFBSUMsbUJBQW1CNUIsR0FBRzZCLElBQUgsR0FDbEJDLEdBRGtCLENBQ2RDLE9BRGMsRUFFbEJELEdBRmtCLENBRWQsVUFBVUUsQ0FBVixFQUFhO0FBQUUsV0FBT0EsRUFBRWpELElBQVQ7QUFBZSxHQUZoQixFQUdsQmtELE1BSGtCLENBR1hmLElBSFcsQ0FBdkI7O0FBS0E7QUFDQSxNQUFJekIsUUFBUU8sR0FBR2tDLGFBQUgsR0FDVEMsS0FEUyxDQUNIL0MsY0FBY0osU0FBZCxDQURHLEVBRVRvRCxNQUZTLENBRUZDLFdBQVdULGdCQUFYLEVBQTZCNUMsU0FBN0IsRUFBd0NELElBQXhDLEVBQThDLElBQTlDLENBRkUsQ0FBWjs7QUFJQTtBQUNBLE1BQUl1RCxRQUFROUIsT0FBTytCLElBQVAsQ0FBWVgsaUJBQWlCNUMsU0FBakIsQ0FBWixFQUF5Q3dELElBQXpDLEVBQVo7QUFDQSxNQUFJQyxlQUFleEQsU0FBU3lELGNBQVQsQ0FBd0IsZUFBeEIsQ0FBbkI7QUFDQUQsZUFBYUUsR0FBYixHQUFtQkwsTUFBTU0sTUFBTixHQUFlLENBQWxDO0FBQ0FILGVBQWF0RCxLQUFiLEdBQXFCbUQsTUFBTU0sTUFBTixHQUFlLENBQXBDO0FBQ0EzRCxXQUFTeUQsY0FBVCxDQUF3QixlQUF4QixFQUF5Q0csU0FBekMsR0FBcURDLFNBQVNSLE1BQU1BLE1BQU1NLE1BQU4sR0FBZSxDQUFyQixDQUFULENBQXJEOztBQUVBO0FBQ0EsTUFBSUcsU0FBU3ZDLE9BQU8rQixJQUFQLENBQVlwQixVQUFVNkIsTUFBVixDQUFpQkMsU0FBakIsQ0FBMkJqRSxTQUEzQixDQUFaLENBQWI7QUFDQSxNQUFJa0UsZ0JBQWdCbEQsR0FBR21ELE1BQUgsQ0FBVSxZQUFWLENBQXBCO0FBQ0FELGdCQUFjRSxTQUFkLENBQXdCLGVBQXhCLEVBQ0dsQyxJQURILENBQ1E2QixNQURSLEVBQ2dCTSxLQURoQixHQUN3QkMsTUFEeEIsQ0FDK0IsUUFEL0IsRUFFS0MsSUFGTCxDQUVVLE9BRlYsRUFFbUIsVUFBQ3ZCLENBQUQ7QUFBQSxXQUFPQSxDQUFQO0FBQUEsR0FGbkIsRUFHS3dCLElBSEwsQ0FHVSxVQUFDeEIsQ0FBRDtBQUFBLFdBQU9BLENBQVA7QUFBQSxHQUhWOztBQUtBO0FBQ0EsTUFBSXlCLFNBQVN6RCxHQUFHbUQsTUFBSCxDQUFVLFVBQVYsQ0FBYjtBQUNBLE1BQUl6RCxPQUFPTSxHQUFHMEQsT0FBSCxFQUFYO0FBQ0EsTUFBSUMsVUFBVTNELEdBQUdtRCxNQUFILENBQVUsVUFBVixDQUFkOztBQUVBO0FBQ0FNLFNBQU9ILE1BQVAsQ0FBYyxHQUFkLEVBQ0dDLElBREgsQ0FDUSxPQURSLEVBQ2lCLGFBRGpCLEVBRUdBLElBRkgsQ0FFUSxXQUZSLEVBRXFCLG9CQUZyQjtBQUdBLE1BQUlLLFNBQVM1RCxHQUFHNkQsV0FBSCxHQUNWQyxXQURVLENBQ0U5RCxHQUFHK0QsTUFBSCxDQUFVLElBQVYsQ0FERixFQUVWQyxLQUZVLENBRUosRUFGSSxFQUdWQyxVQUhVLENBR0MsR0FIRCxFQUlWQyxLQUpVLENBSUosQ0FKSSxFQUtWQyxLQUxVLENBS0oxRSxLQUxJLENBQWI7QUFNQWdFLFNBQU9OLE1BQVAsQ0FBYyxjQUFkLEVBQ0dpQixJQURILENBQ1FSLE1BRFI7O0FBR0E7QUFDQSxNQUFJUyxjQUFjWixPQUFPSCxNQUFQLENBQWMsR0FBZCxFQUNYQyxJQURXLENBQ04sT0FETSxFQUNHLFVBREgsQ0FBbEI7QUFFQWMsY0FBWWpCLFNBQVosQ0FBc0IsTUFBdEIsRUFDS2xDLElBREwsQ0FDVW9ELFNBQVNDLE9BQVQsQ0FBaUJsRCxRQUFqQixFQUEyQkEsU0FBU21ELE9BQVQsQ0FBaUJuRCxRQUE1QyxFQUFzRG9ELFFBRGhFLEVBRUtwQixLQUZMLEdBRWFDLE1BRmIsQ0FFb0IsTUFGcEIsRUFHT0MsSUFIUCxDQUdZLFFBSFosRUFHc0IsTUFIdEIsRUFJT0EsSUFKUCxDQUlZLGNBSlosRUFJNEIsR0FKNUIsRUFLT0EsSUFMUCxDQUtZLE1BTFosRUFLb0IsVUFBVXZCLENBQVYsRUFBYTtBQUN6QixRQUFJMEMsTUFBTUMsT0FBTzNDLEVBQUU0QyxVQUFGLENBQWFDLEtBQXBCLEVBQTJCOUYsSUFBM0IsRUFBaUNDLFNBQWpDLENBQVY7QUFDQSxXQUFPMEYsUUFBUSxJQUFSLEdBQWUsTUFBZixHQUF3QmpGLE1BQU1pRixHQUFOLENBQS9CO0FBQ0QsR0FSUCxFQVNPbkIsSUFUUCxDQVNZLElBVFosRUFTa0IsVUFBVXZCLENBQVYsRUFBYTtBQUFFLFdBQU9BLEVBQUU2QyxLQUFUO0FBQWdCLEdBVGpELEVBVU90QixJQVZQLENBVVksR0FWWixFQVVpQjdELElBVmpCLEVBV09vRixFQVhQLENBV1UsV0FYVixFQVd1QkMsTUFYdkIsRUFZT0QsRUFaUCxDQVlVLFdBWlYsRUFZdUJFLE1BWnZCLEVBYU9GLEVBYlAsQ0FhVSxVQWJWLEVBYXNCRyxLQWJ0Qjs7QUFlQTtBQUNBeEIsU0FBT0gsTUFBUCxDQUFjLE1BQWQsRUFDS0MsSUFETCxDQUNVLGNBRFYsRUFDMEIsR0FEMUIsRUFFS0EsSUFGTCxDQUVVLEdBRlYsRUFFZTdELEtBQUs0RSxTQUFTWSxJQUFULENBQWM5RCxFQUFkLEVBQWtCQSxHQUFHb0QsT0FBSCxDQUFXekIsTUFBN0IsQ0FBTCxDQUZmOztBQUlBOzs7Ozs7OztBQVFBLFdBQVM0QixNQUFULENBQWlCRSxLQUFqQixFQUF3QjlGLElBQXhCLEVBQThCQyxTQUE5QixFQUFzRDtBQUFBLFFBQWJtRyxJQUFhLHVFQUFOLElBQU07O0FBQ3BELFFBQUlDLE1BQU14RCxpQkFBaUI1QyxTQUFqQixFQUE0QkQsSUFBNUIsRUFBa0NzRyxJQUFsQyxDQUF1QztBQUFBLGFBQU1DLEdBQUczRSxFQUFILEtBQVVrRSxLQUFoQjtBQUFBLEtBQXZDLENBQVY7QUFDQSxXQUFPTyxRQUFRRyxTQUFSLEdBQW9CLElBQXBCLEdBQTJCSCxJQUFJRCxJQUFKLENBQWxDO0FBQ0Q7O0FBRUQ7QUFDQSxXQUFTSixNQUFULENBQWlCL0MsQ0FBakIsRUFBb0I7QUFDbEJoQyxPQUFHbUQsTUFBSCxDQUFVLElBQVYsRUFBZ0JxQyxPQUFoQixDQUF3QixXQUF4QixFQUFxQyxJQUFyQztBQUNEO0FBQ0QsV0FBU1IsTUFBVCxDQUFpQmhELENBQWpCLEVBQW9CO0FBQ2xCLFFBQUltRCxPQUFPbEcsU0FBU3lELGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0N2RCxLQUEzQztBQUNBd0UsWUFDSzhCLEtBREwsQ0FDVyxNQURYLEVBQ21CekYsR0FBRzBGLEtBQUgsQ0FBU0MsS0FBVCxHQUFpQixFQUFqQixHQUFzQixJQUR6QyxFQUVLRixLQUZMLENBRVcsS0FGWCxFQUVrQnpGLEdBQUcwRixLQUFILENBQVNFLEtBQVQsR0FBaUIsRUFBakIsR0FBc0IsSUFGeEMsRUFHS0gsS0FITCxDQUdXLFNBSFgsRUFHc0IsY0FIdEIsRUFJS0ksSUFKTCxjQUlxQjdELEVBQUU0QyxVQUFGLENBQWFrQixJQUpsQyxVQUkyQzlELEVBQUU0QyxVQUFGLENBQWFqRCxLQUp4RCx5QkFJaUZnRCxPQUFPM0MsRUFBRTRDLFVBQUYsQ0FBYUMsS0FBcEIsRUFBMkI5RixJQUEzQixFQUFpQ0MsU0FBakMsRUFBNENtRyxJQUE1QyxDQUpqRjtBQUtEO0FBQ0QsV0FBU0YsS0FBVCxDQUFnQmpELENBQWhCLEVBQW1CO0FBQ2pCMkIsWUFBUThCLEtBQVIsQ0FBYyxTQUFkLEVBQXlCLE1BQXpCO0FBQ0F6RixPQUFHbUQsTUFBSCxDQUFVLElBQVYsRUFBZ0JxQyxPQUFoQixDQUF3QixXQUF4QixFQUFxQyxLQUFyQztBQUNEO0FBQ0Q7O0FBRUE7QUFDQSxNQUFJTyxtQkFBbUJ2RyxPQUFPd0csTUFBUCxDQUFjLGNBQWQsRUFBOEIsR0FBOUIsRUFBbUMsR0FBbkMsQ0FBdkI7QUFDQSxNQUFJQyxpQkFBaUIsSUFBSXpHLE9BQU9ELEtBQVgsQ0FBaUJ3RyxnQkFBakIsRUFBbUM1RSxVQUFVRSxRQUFWLENBQW1CZCxFQUFuQixDQUFzQnZCLFNBQXRCLEVBQWlDRCxJQUFqQyxDQUFuQyxDQUFyQjtBQUNBa0gsaUJBQWVDLFVBQWYsQ0FBMEIsRUFBMUIsRUFBOEIsRUFBOUIsRUFBa0MsRUFBbEMsRUFBc0MsR0FBdEM7QUFDQUQsaUJBQWVFLGVBQWYsQ0FBK0IsR0FBL0IsRUFBb0MsTUFBcEMsRUFBNENuQyxLQUE1QyxHQUFvRCxRQUFwRDtBQUNBLE1BQUlvQyxrQkFBa0JILGVBQWVJLGNBQWYsQ0FBOEIsR0FBOUIsRUFBbUMsT0FBbkMsQ0FBdEI7QUFDQUQsa0JBQWdCcEMsS0FBaEIsR0FBd0JzQyxhQUFhLElBQWIsQ0FBeEI7QUFDQTtBQUNBTCxpQkFBZU0sU0FBZixDQUF5QixJQUF6QixFQUErQi9HLE9BQU9nSCxJQUFQLENBQVlDLEdBQTNDO0FBQ0FSLGlCQUFlUyxJQUFmO0FBQ0E7O0FBRUE7QUFDQSxNQUFJQyw2QkFBNkJuSCxPQUFPd0csTUFBUCxDQUFjLHlCQUFkLEVBQXlDLEdBQXpDLEVBQThDLEdBQTlDLENBQWpDO0FBQ0EsTUFBSVksMkJBQTJCLElBQUlwSCxPQUFPRCxLQUFYLENBQWlCb0gsMEJBQWpCLEVBQTZDeEYsVUFBVUUsUUFBVixDQUFtQndGLFVBQW5CLENBQThCdEcsRUFBOUIsQ0FBaUN2QixTQUFqQyxFQUE0Q0QsSUFBNUMsQ0FBN0MsQ0FBL0I7QUFDQTZILDJCQUF5QlYsVUFBekIsQ0FBb0MsRUFBcEMsRUFBd0MsRUFBeEMsRUFBNEMsRUFBNUMsRUFBZ0QsR0FBaEQ7QUFDQVUsMkJBQXlCVCxlQUF6QixDQUF5QyxHQUF6QyxFQUE4QyxNQUE5QyxFQUFzRG5DLEtBQXRELEdBQThELFFBQTlEO0FBQ0EsTUFBSThDLDRCQUE0QkYseUJBQXlCUCxjQUF6QixDQUF3QyxHQUF4QyxFQUE2QyxPQUE3QyxDQUFoQztBQUNBUyw0QkFBMEI5QyxLQUExQixHQUFrQ3NDLGFBQWEsSUFBYixDQUFsQztBQUNBO0FBQ0FNLDJCQUF5QkwsU0FBekIsQ0FBbUMsSUFBbkMsRUFBeUMvRyxPQUFPZ0gsSUFBUCxDQUFZQyxHQUFyRDtBQUNBRywyQkFBeUJGLElBQXpCO0FBQ0E7O0FBRUE7QUFDQSxNQUFJSyxrQkFBa0J2SCxPQUFPd0csTUFBUCxDQUFjLGFBQWQsRUFBNkIsR0FBN0IsRUFBa0MsR0FBbEMsQ0FBdEI7QUFDQSxNQUFJZ0IsZ0JBQWdCLElBQUl4SCxPQUFPRCxLQUFYLENBQWlCd0gsZUFBakIsRUFBa0M1RixVQUFVNEIsTUFBVixDQUFpQnhDLEVBQWpCLENBQW9CdkIsU0FBcEIsRUFBK0JELElBQS9CLEVBQXFDa0ksTUFBckMsQ0FBNEMsVUFBVWpGLENBQVYsRUFBYTtBQUM3RyxXQUFPQSxFQUFFVixJQUFGLEtBQVcsSUFBbEI7QUFDRCxHQUZxRCxDQUFsQyxDQUFwQjtBQUdBMEYsZ0JBQWNkLFVBQWQsQ0FBeUIsRUFBekIsRUFBNkIsRUFBN0IsRUFBaUMsRUFBakMsRUFBcUMsR0FBckM7QUFDQWMsZ0JBQWNiLGVBQWQsQ0FBOEIsR0FBOUIsRUFBbUMsTUFBbkMsRUFBMkNuQyxLQUEzQyxHQUFtRCxPQUFuRDtBQUNBO0FBQ0EsTUFBSWtELGlCQUFpQkYsY0FBY1gsY0FBZCxDQUE2QixHQUE3QixFQUFrQyxPQUFsQyxDQUFyQjtBQUNBYSxpQkFBZWxELEtBQWYsR0FBdUJzQyxhQUFhLElBQWIsQ0FBdkI7QUFDQTtBQUNBVSxnQkFBY1QsU0FBZCxDQUF3QixJQUF4QixFQUE4Qi9HLE9BQU9nSCxJQUFQLENBQVlDLEdBQTFDO0FBQ0FPLGdCQUFjTixJQUFkO0FBQ0E7O0FBRUE7QUFDQSxNQUFJUyxhQUFhaEcsVUFBVTZCLE1BQVYsQ0FBaUJDLFNBQWpCLENBQTJCakUsU0FBM0IsRUFBc0NvSSxFQUF0QyxDQUF5Q0MsR0FBekMsQ0FBNkMsVUFBVXJGLENBQVYsRUFBYTtBQUN6RSxXQUFPLEVBQUNqRCxNQUFNaUQsRUFBRWpELElBQVQsRUFBZUksT0FBTzZDLEVBQUUvQyxTQUFTeUQsY0FBVCxDQUF3QixNQUF4QixFQUFnQ3ZELEtBQWxDLENBQXRCLEVBQVA7QUFDRCxHQUZnQixDQUFqQjtBQUdBLE1BQUltSSxnQkFBZ0I5SCxPQUFPd0csTUFBUCxDQUFjLFNBQWQsRUFBeUIsR0FBekIsRUFBOEIsR0FBOUIsQ0FBcEI7QUFDQSxNQUFJdUIsY0FBYyxJQUFJL0gsT0FBT0QsS0FBWCxDQUFpQitILGFBQWpCLEVBQWdDSCxVQUFoQyxDQUFsQjtBQUNBSSxjQUFZckIsVUFBWixDQUF1QixFQUF2QixFQUEyQixDQUEzQixFQUE4QixFQUE5QixFQUFrQyxFQUFsQztBQUNBcUIsY0FBWXBCLGVBQVosQ0FBNEIsR0FBNUIsRUFBaUMsTUFBakMsRUFBeUNuQyxLQUF6QyxHQUFpRCxNQUFqRDtBQUNBLE1BQUl3RCxlQUFlRCxZQUFZRSxPQUFaLENBQW9CLEdBQXBCLEVBQXlCLE9BQXpCLENBQW5CO0FBQ0FELGVBQWF4RCxLQUFiLEdBQXFCc0MsYUFBYSxJQUFiLENBQXJCO0FBQ0FpQixjQUFZaEIsU0FBWixDQUFzQixJQUF0QixFQUE0Qi9HLE9BQU9nSCxJQUFQLENBQVlrQixJQUF4QztBQUNBO0FBQ0FILGNBQVliLElBQVo7QUFDQTs7QUFFQTtBQUNBeEQsZ0JBQWM0QixFQUFkLENBQWlCLFFBQWpCLEVBQTJCLFlBQVk7QUFDckMsUUFBSUssT0FBT2xHLFNBQVN5RCxjQUFULENBQXdCLE1BQXhCLEVBQWdDdkQsS0FBM0M7QUFDQW9JLGdCQUFZckcsSUFBWixHQUFtQkMsVUFBVTZCLE1BQVYsQ0FBaUJDLFNBQWpCLENBQTJCakUsU0FBM0IsRUFBc0MsS0FBS0csS0FBM0MsRUFBa0RrSSxHQUFsRCxDQUFzRCxVQUFVckYsQ0FBVixFQUFhO0FBQ3BGLGFBQU8sRUFBQ2pELE1BQU1pRCxFQUFFakQsSUFBVCxFQUFlSSxPQUFPNkMsRUFBRW1ELElBQUYsQ0FBdEIsRUFBUDtBQUNELEtBRmtCLENBQW5CO0FBR0FvQyxnQkFBWWIsSUFBWjtBQUNELEdBTkQ7QUFPQWpFLGVBQWFrRixnQkFBYixDQUE4QixRQUE5QixFQUF3QyxZQUFZO0FBQ2xEMUksYUFBU3lELGNBQVQsQ0FBd0IsZUFBeEIsRUFBeUNHLFNBQXpDLEdBQXFEQyxTQUFTUixNQUFNLEtBQUtuRCxLQUFYLENBQVQsQ0FBckQ7QUFDQXlJLGdCQUFZdEYsTUFBTSxLQUFLbkQsS0FBWCxDQUFaLEVBQStCLElBQS9CLEVBQXFDLElBQXJDO0FBQ0QsR0FIRDtBQUlBRixXQUFTeUQsY0FBVCxDQUF3QixXQUF4QixFQUFxQ2lGLGdCQUFyQyxDQUFzRCxRQUF0RCxFQUFnRSxZQUFZO0FBQzFFQyxnQkFBWSxJQUFaLEVBQWtCLEtBQUt6SSxLQUF2QixFQUE4QixJQUE5QjtBQUNELEdBRkQ7QUFHQUYsV0FBU3lELGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0NpRixnQkFBaEMsQ0FBaUQsUUFBakQsRUFBMkQsWUFBWTtBQUNyRUMsZ0JBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixLQUFLekksS0FBN0I7QUFDRCxHQUZEOztBQUlBLFdBQVN5SSxXQUFULENBQXNCN0ksSUFBdEIsRUFBNEJDLFNBQTVCLEVBQXVDbUcsSUFBdkMsRUFBNkM7QUFDM0MsUUFBSTBDLGdCQUFnQixLQUFwQjtBQUNBLFFBQUk5SSxJQUFKLEVBQVU7QUFBRThJLHNCQUFnQixJQUFoQjtBQUFzQjtBQUNsQzlJLFdBQU9BLFFBQVF1RCxNQUFNRyxhQUFhdEQsS0FBbkIsQ0FBZjtBQUNBSCxnQkFBWUEsYUFBYUMsU0FBU0MsYUFBVCxDQUF1QixZQUF2QixFQUFxQ0MsS0FBOUQ7QUFDQWdHLFdBQU9BLFFBQVFsRyxTQUFTQyxhQUFULENBQXVCLE9BQXZCLEVBQWdDQyxLQUEvQztBQUNBLFFBQUl3QyxRQUFRMUMsU0FBU0MsYUFBVCxDQUF1QixZQUF2QixFQUFxQ0MsS0FBakQ7O0FBRUFNLFVBQ0cyQyxNQURILENBQ1VDLFdBQVdULGdCQUFYLEVBQTZCNUMsU0FBN0IsRUFBd0NELElBQXhDLEVBQThDb0csSUFBOUMsQ0FEVixFQUVHaEQsS0FGSCxDQUVTL0MsY0FBY0osU0FBZCxDQUZUOztBQUlBcUYsZ0JBQVlqQixTQUFaLENBQXNCLE1BQXRCLEVBQ0dHLElBREgsQ0FDUSxNQURSLEVBQ2dCLFVBQVV2QixDQUFWLEVBQWE7QUFDekIsVUFBSTBDLE1BQU1DLE9BQU8zQyxFQUFFNEMsVUFBRixDQUFhQyxLQUFwQixFQUEyQjlGLElBQTNCLEVBQWlDQyxTQUFqQyxFQUE0Q21HLElBQTVDLENBQVY7QUFDQSxhQUFPMUYsTUFBTWlGLEdBQU4sQ0FBUDtBQUNELEtBSkg7O0FBTUFqQixXQUFPTixNQUFQLENBQWMsY0FBZCxFQUE4QjJFLE1BQTlCLEdBbEIyQyxDQWtCSjtBQUN2Q2xFLFdBQU9PLEtBQVAsQ0FBYTFFLEtBQWI7QUFDQWdFLFdBQU9OLE1BQVAsQ0FBYyxjQUFkLEVBQ0dpQixJQURILENBQ1FSLE1BRFI7O0FBR0E7QUFDQXFDLG1CQUFlL0UsSUFBZixHQUFzQkMsVUFBVUUsUUFBVixDQUFtQjhELElBQW5CLEVBQXlCbkcsU0FBekIsRUFBb0NELElBQXBDLENBQXRCO0FBQ0FxSCxvQkFBZ0JwQyxLQUFoQixHQUF3QnNDLGFBQWFuQixJQUFiLENBQXhCO0FBQ0FjLG1CQUFlUyxJQUFmOztBQUVBTSxrQkFBYzlGLElBQWQsR0FBcUJDLFVBQVU0QixNQUFWLENBQWlCb0MsSUFBakIsRUFBdUJuRyxTQUF2QixFQUFrQ0QsSUFBbEMsRUFBd0NrSSxNQUF4QyxDQUErQyxVQUFVakYsQ0FBVixFQUFhO0FBQy9FLGFBQU9BLEVBQUVWLElBQUYsS0FBVyxJQUFsQjtBQUNELEtBRm9CLENBQXJCO0FBR0E7QUFDQTRGLG1CQUFlbEQsS0FBZixHQUF1QnNDLGFBQWFuQixJQUFiLENBQXZCO0FBQ0E2QixrQkFBY04sSUFBZDs7QUFFQUUsNkJBQXlCMUYsSUFBekIsR0FBZ0NDLFVBQVVFLFFBQVYsQ0FBbUJ3RixVQUFuQixDQUE4QjFCLElBQTlCLEVBQW9DbkcsU0FBcEMsRUFBK0NELElBQS9DLENBQWhDO0FBQ0E7QUFDQStILDhCQUEwQjlDLEtBQTFCLEdBQWtDc0MsYUFBYW5CLElBQWIsQ0FBbEM7QUFDQXlCLDZCQUF5QkYsSUFBekI7O0FBRUEsUUFBSSxDQUFDbUIsYUFBTCxFQUFvQjtBQUNsQk4sa0JBQVlyRyxJQUFaLEdBQW1CQyxVQUFVNkIsTUFBVixDQUFpQkMsU0FBakIsQ0FBMkJqRSxTQUEzQixFQUFzQzJDLEtBQXRDLEVBQTZDMEYsR0FBN0MsQ0FBaUQsVUFBVXJGLENBQVYsRUFBYTtBQUMvRSxlQUFPLEVBQUNqRCxNQUFNaUQsRUFBRWpELElBQVQsRUFBZUksT0FBTzZDLEVBQUVtRCxJQUFGLENBQXRCLEVBQVA7QUFDRCxPQUZrQixDQUFuQjtBQUdBcUMsbUJBQWF4RCxLQUFiLEdBQXFCc0MsYUFBYW5CLElBQWIsQ0FBckI7QUFDQTtBQUNBb0Msa0JBQVliLElBQVo7QUFDRDtBQUNGO0FBQ0Q7QUFDRCxDLENBQUM7O0FBRUY7OztBQUdBOzs7Ozs7O0FBT0EsU0FBU3JFLFVBQVQsQ0FBcUJuQixJQUFyQixFQUEyQmxDLFNBQTNCLEVBQXNDRCxJQUF0QyxFQUE0Q29HLElBQTVDLEVBQWtEO0FBQ2hELFNBQU9qRSxLQUFLbEMsU0FBTCxFQUFnQkQsSUFBaEIsRUFBc0JzSSxHQUF0QixDQUEwQjtBQUFBLFdBQU1yRixFQUFFK0YsWUFBRixHQUFpQixFQUFqQixJQUF1Qi9GLEVBQUVyQixFQUFGLEtBQVM3QixVQUFoQyxJQUE4Q2tELEVBQUVtRCxJQUFGLE1BQVksSUFBM0QsR0FBbUUsQ0FBQ25ELEVBQUVtRCxJQUFGLENBQXBFLEdBQThFLElBQW5GO0FBQUEsR0FBMUIsQ0FBUDtBQUNEOztBQUVEOzs7OztBQUtBLFNBQVNwRCxPQUFULENBQWtCQyxDQUFsQixFQUFxQjtBQUNuQixTQUFPQSxFQUFFckIsRUFBRixVQUFZcUIsRUFBRStGLFlBQWQsR0FBNkIvRixFQUFFZ0csYUFBL0IsR0FBaUQsSUFBakQsR0FBd0QsS0FBL0Q7QUFDRDs7QUFFRDs7Ozs7QUFLQSxTQUFTbEYsUUFBVCxDQUFtQmQsQ0FBbkIsRUFBc0I7QUFDcEIsTUFBSWlHLE1BQU0saUJBQWlCQyxJQUFqQixDQUFzQmxHLENBQXRCLENBQVY7QUFDQWlHLE1BQUksQ0FBSixJQUFTQSxJQUFJLENBQUosSUFBUyxFQUFULFVBQW1CQSxJQUFJLENBQUosQ0FBbkIsVUFBbUNBLElBQUksQ0FBSixDQUE1QztBQUNBQSxNQUFJLENBQUosSUFBU0EsSUFBSSxDQUFKLElBQVMsRUFBVCxVQUFtQkEsSUFBSSxDQUFKLENBQW5CLFVBQW1DQSxJQUFJLENBQUosQ0FBNUM7QUFDQSxTQUFVQSxJQUFJLENBQUosQ0FBVixTQUFvQkEsSUFBSSxDQUFKLENBQXBCO0FBQ0Q7O0FBRUQsSUFBSTNCLGVBQWU7QUFDakIvRixNQUFJLG1CQURhO0FBRWpCNEgsTUFBSSxzQkFGYTtBQUdqQjdILE9BQUssNkJBSFk7QUFJakJELFdBQVM7QUFKUSxDQUFuQixDOzs7Ozs7QUN2VkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0EsZ0NBQWdDLFVBQVUsRUFBRTtBQUM1QyxDOzs7Ozs7QUN6QkE7QUFDQTs7O0FBR0E7QUFDQSwrQkFBZ0MsaUJBQWlCLGdCQUFnQixHQUFHLGNBQWMsc0JBQXNCLGVBQWUsZ0JBQWdCLGtCQUFrQixtQkFBbUIsdUJBQXVCLHdCQUF3QixHQUFHLGdCQUFnQix1QkFBdUIseUJBQXlCLEdBQUcsb0JBQW9CLGtCQUFrQixHQUFHLGdCQUFnQixrQkFBa0IsbUJBQW1CLHNCQUFzQixLQUFLLGtCQUFrQixlQUFlLGlCQUFpQixHQUFHLDZCQUE2QixlQUFlLGtCQUFrQixnQ0FBZ0MsR0FBRyxjQUFjLDRCQUE0QixvQkFBb0IsR0FBRyx1QkFBdUIsdUJBQXVCLEdBQUcsb0JBQW9CLDhCQUE4QixpQkFBaUIsa0JBQWtCLHVCQUF1QixHQUFHLGNBQWMsdUJBQXVCLGtCQUFrQixvQkFBb0IsaUJBQWlCLCtDQUErQywyQkFBMkIsdUJBQXVCLGtCQUFrQix1QkFBdUIsR0FBRzs7QUFFMS9COzs7Ozs7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxnQkFBZ0I7QUFDbkQsSUFBSTtBQUNKO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixpQkFBaUI7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLG9CQUFvQjtBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvREFBb0QsY0FBYzs7QUFFbEU7QUFDQTs7Ozs7OztBQzNFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQSxpQkFBaUIsbUJBQW1CO0FBQ3BDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlCQUFpQixzQkFBc0I7QUFDdkM7O0FBRUE7QUFDQSxtQkFBbUIsMkJBQTJCOztBQUU5QztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsZ0JBQWdCLG1CQUFtQjtBQUNuQztBQUNBOztBQUVBO0FBQ0E7O0FBRUEsaUJBQWlCLDJCQUEyQjtBQUM1QztBQUNBOztBQUVBLFFBQVEsdUJBQXVCO0FBQy9CO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUEsaUJBQWlCLHVCQUF1QjtBQUN4QztBQUNBOztBQUVBLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLGdCQUFnQixpQkFBaUI7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7O0FBRWQsa0RBQWtELHNCQUFzQjtBQUN4RTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLENBQUM7O0FBRUQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7O0FBRUEsNkJBQTZCLG1CQUFtQjs7QUFFaEQ7O0FBRUE7O0FBRUE7QUFDQTs7Ozs7Ozs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLFdBQVcsRUFBRTtBQUNyRCx3Q0FBd0MsV0FBVyxFQUFFOztBQUVyRDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBLHNDQUFzQztBQUN0QyxHQUFHO0FBQ0g7QUFDQSw4REFBOEQ7QUFDOUQ7O0FBRUE7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCAxNTA0ZmFlZjdlODdjYmJiMjdlZiIsImltcG9ydCAnLi9zdHlsZS5jc3MnXG4vLyBpbXBvcnQgKiBhcyBkMyBmcm9tICdkMydcbi8vIGltcG9ydCAnZDMtcXVldWUnXG4vLyBpbXBvcnQgKiBhcyBkM0xlZ2VuZCBmcm9tICdkMy1zdmctbGVnZW5kJ1xuLy8gaW1wb3J0ICogYXMgdG9wb2pzb24gZnJvbSAndG9wb2pzb24nXG4vLyBpbXBvcnQge2RpbXBsZX0gZnJvbSAnZGltcGxlJ1xuLy8gaW1wb3J0IGJhckNoYXJ0IGZyb20gJy4uL2NoYXJ0cy9iYXItY2hhcnQuanMnXG5cbi8vIFRPRE86IGJldHRlciBzdGF0ZSBtYW5hZ2VtZW50XG4vLyBUT0RPOiBnZXQgZGltcGxlICYgd2VicGFjayB3b3JraW5nIGNvcnJlY3RseVxuLy8gVE9ETzogY291bnR5IGxpbmVzaGFwZXMgdHJhbnNpdGlvbiB0byBjaXJjbGVzXG4vLyBUT0RPOiBtYXAgdG9vbHRpcCBmb2xsb3cgbW91c2Vcbi8vIFRPRE86IG1hcCB6b29taW5nXG4vLyBUT0RPOiBuZXQgZmxvdyBpbi1vdXRcbi8vIFRPRE86IHN0YXRlIGZsb3c6IGluLCBvdXQsIGRlbHRhXG4vLyBUT0RPOiB0b3RhbCBudW1iZXIgb2YgY291bnRpZXNcbi8vIFRPRE86IGNoYW5nZSBjaGFydCBjb2xvcnMgb24gaW0vZW0taWdyYXRlIGRpcmVjdGlvbiBjaGFuZ2Vcbi8vIFRPRE86IGRpbXBsZSBkb2Vzbid0IHNlZW0gdG8gaGFuZGxlIGVsZW1lbnRzIGluIHNlbGVjdGlvbi5leGl0KCkgcHJvcGVybHlcbi8vICAgICAtIHRocm93cyBgRXJyb3I6IDxyZWN0PiBhdHRyaWJ1dGUgeDogRXhwZWN0ZWQgbGVuZ3RoLCBcIk5hTlwiLmAgb24gcmVkcmF3XG4vLyBUT0RPOiB1c2UgbWlzbyBmb3IgZGF0YSBncm91cGluZz8gaHR0cDovL21pc29wcm9qZWN0LmNvbS9kYXRhc2V0L1xuLy8gICAgIC1yZS1tdW5nZSBkYXRhIHRvIGNvbnRhaW4gY29sdW1uICdkaXJlY3Rpb24nID0gaW58fG91dFxuXG5sZXQgZmlwc0NvdW50eSA9ICcwNjA3NSdcbmxldCB5ZWFyID0gJzE0MTUnXG5sZXQgZGlyZWN0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RpcmVjdGlvbicpLnZhbHVlXG5cbmxldCBjb2xvclN3YXRjaGVzID0ge1xuICBpbjogWycjZjdmY2Y1JywgJyNlNWY1ZTAnLCAnI2M3ZTljMCcsICcjYTFkOTliJywgJyM3NGM0NzYnLCAnIzQxYWI1ZCcsICcjMjM4YjQ1JywgJyMwMDZkMmMnLCAnIzAwNDQxYiddLFxuICBvdXQ6IFsnI2ZmZjVmMCcsICcjZmVlMGQyJywgJyNmY2JiYTEnLCAnI2ZjOTI3MicsICcjZmI2YTRhJywgJyNlZjNiMmMnLCAnI2NiMTgxZCcsICcjYTUwZjE1JywgJyM2NzAwMGQnXVxufVxuXG5jb2xvclN3YXRjaGVzLmNoYXJ0ID0ge1xuICBpbjogbmV3IGRpbXBsZS5jb2xvcihjb2xvclN3YXRjaGVzLmluWzZdKSxcbiAgb3V0OiBuZXcgZGltcGxlLmNvbG9yKGNvbG9yU3dhdGNoZXMub3V0WzZdKVxufVxuXG5sZXQgcGF0aCA9ICcuLi9kYXRhJ1xubGV0IGRhdGFQYXRoID0gYCR7cGF0aH0vJHtmaXBzQ291bnR5fS8ke2ZpcHNDb3VudHl9Y29tYmluZWQuY3N2YFxubGV0IGNoYXJ0UGF0aCA9IGAke3BhdGh9L2NoYXJ0RGF0YS5qc29uYFxubGV0IHNoYXBlc1BhdGggPSBgJHtwYXRofS8ke2ZpcHNDb3VudHl9LyR7Zmlwc0NvdW50eX1zaGFwZXMudG9wb2pzb25gXG5sZXQgc3RhdGVzUGF0aCA9IGAke3BhdGh9L2dlby9zdGF0ZXMudG9wb2pzb25gXG5sZXQgZmlwc1BhdGggPSBgJHtwYXRofS9maXBzY29kZXMuY3N2YFxuXG5kMy5xdWV1ZSgpXG4gIC5kZWZlcihkMy5jc3YsIGRhdGFQYXRoLCBmdW5jdGlvbiAocm93KSB7XG4gICAgbGV0IG1lYW5BZ2kgPSArcm93LmFnaSAvICtyb3cubjFcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihyb3csIHttZWFuQWdpOiBtZWFuQWdpfSlcbiAgfSlcbiAgLmRlZmVyKGQzLmpzb24sIGNoYXJ0UGF0aClcbiAgLmRlZmVyKGQzLmpzb24sIHN0YXRlc1BhdGgpXG4gIC5kZWZlcihkMy5qc29uLCBzaGFwZXNQYXRoKVxuICAuZGVmZXIoZDMuY3N2LCBmaXBzUGF0aCwgZnVuY3Rpb24gKHJvdykge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHJvdywge2lkOiByb3cuc3RhdGVmcC5jb25jYXQocm93LmNvdW50eWZwKX0pXG4gIH0pXG4gIC5hd2FpdChpbml0aWFsRHJhdylcblxuZnVuY3Rpb24gaW5pdGlhbERyYXcgKGVycm9yLCBkYXRhLCBjaGFydERhdGEsIHVzLCBjb3VudGllcywgZmlwcykge1xuICBpZiAoZXJyb3IpIHsgdGhyb3cgZXJyb3IgfVxuICAvKipcbiAgICAqIGZpcHNNYXAgaGFzIG1hcHBpbmcgb2Y6XG4gICAgKiAgLSBzdGF0ZSBmaXBzIHRvIHN0YXRlIGFiYnJldjpcbiAgICAqICAgICB7JzA2JzogJ0NBJ31cbiAgICAqICAtIHN0YXRlK2NvdW50eSBmaXBzIHRvIGNvdW50eSBkYXRhIGZyb20gZDMuY3N2UGFyc2UoZmlwc2NvZGVzLmNzdik6XG4gICAgKiAgICAgIHsgJzA2MDc1Jzoge1xuICAgICogICAgICAgICAgaWQ6ICcwNjA3NScsXG4gICAgKiAgICAgICAgICBzdGF0ZTogJ0NBJyxcbiAgICAqICAgICAgICAgIHN0YXRlZnA6ICcwNicsXG4gICAgKiAgICAgICAgICBjb3VudHlmcDogJzA3NScsXG4gICAgKiAgICAgICAgICBuYW1lOiAnU2FuIEZyYW5jaXNjbyBDb3VudHknLFxuICAgICogICAgICAgICAgdHlwZTogJ0gxXG4gICAgKiAgICAgICAgfVxuICAgICogICAgICB9XG4gICAgKi9cbiAgbGV0IGZpcHNNYXAgPSBuZXcgTWFwKClcbiAgZmlwcy5mb3JFYWNoKGZ1bmN0aW9uIChyb3cpIHtcbiAgICBmaXBzTWFwLnNldChyb3cuaWQsIHJvdylcbiAgICBmaXBzTWFwLnNldChyb3cuc3RhdGVmcCwgcm93LnN0YXRlKVxuICB9KVxuXG4gIC8qKlxuICAgKiBuZXN0ZWRDb3VudHlEYXRhIG5lc3RzIGRhdGEgZnJvbSBkMy5jc3ZQYXJzZSgwMDAwMGNvbWJpbmVkLmNzdikgYnk6XG4gICAqICAgLWRpcmVjdGlvbjogWydpbicsICdvdXQnXVxuICAgKiAgICAgLXllYXI6IFsnMDQwNScsIC4uLiwgJzE0MTUnXVxuICAgKiAgICAgICAgLWFycmF5IG9mXG4gICAqICAgICAgICAgIC1kYXRhOiB7YWdpLGlkLG4xLG4yLHkxX2NvdW50eWZpcHMseTFfc3RhdGVmaXBzLHkyX2NvdW50eWZpcHMseTJfc3RhdGVmaXBzLHllYXJ9XG4gICAqL1xuICBsZXQgbmVzdGVkQ291bnR5RGF0YSA9IGQzLm5lc3QoKVxuICAgICAgLmtleShpbk9yT3V0KVxuICAgICAgLmtleShmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC55ZWFyIH0pXG4gICAgICAub2JqZWN0KGRhdGEpXG5cbiAgLyogKioqIHNldCBjb2xvciBzY2FsZSAqKiogKi9cbiAgbGV0IGNvbG9yID0gZDMuc2NhbGVRdWFudGlsZSgpXG4gICAgLnJhbmdlKGNvbG9yU3dhdGNoZXNbZGlyZWN0aW9uXSlcbiAgICAuZG9tYWluKGRvbWFpblZhbHMobmVzdGVkQ291bnR5RGF0YSwgZGlyZWN0aW9uLCB5ZWFyLCAnbjEnKSlcblxuICAvKiAqKiogcG9wdWxhdGUgeWVhciBzZWxlY3RvciAqKiogKi9cbiAgbGV0IHllYXJzID0gT2JqZWN0LmtleXMobmVzdGVkQ291bnR5RGF0YVtkaXJlY3Rpb25dKS5zb3J0KClcbiAgbGV0IHllYXJTZWxlY3RvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFyLXNlbGVjdG9yJylcbiAgeWVhclNlbGVjdG9yLm1heCA9IHllYXJzLmxlbmd0aCAtIDFcbiAgeWVhclNlbGVjdG9yLnZhbHVlID0geWVhcnMubGVuZ3RoIC0gMVxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VsZWN0ZWQteWVhcicpLmlubmVySFRNTCA9IGZ1bGxZZWFyKHllYXJzW3llYXJzLmxlbmd0aCAtIDFdKVxuXG4gIC8qICoqKiBwb3B1bGF0ZSBzdGF0ZSBzZWxlY3RvciAqKiogKi9cbiAgbGV0IHN0YXRlcyA9IE9iamVjdC5rZXlzKGNoYXJ0RGF0YS5jaGFydHMubGluZWNoYXJ0W2RpcmVjdGlvbl0pXG4gIGxldCBzdGF0ZVNlbGVjdG9yID0gZDMuc2VsZWN0KCcjc3RhdGV5ZWFyJylcbiAgc3RhdGVTZWxlY3Rvci5zZWxlY3RBbGwoJy5zdGF0ZW9wdGlvbnMnKVxuICAgIC5kYXRhKHN0YXRlcykuZW50ZXIoKS5hcHBlbmQoJ29wdGlvbicpXG4gICAgICAuYXR0cigndmFsdWUnLCAoZCkgPT4gZClcbiAgICAgIC50ZXh0KChkKSA9PiBkKVxuXG4gIC8qICoqKiBzdGFydCBtYXAgZHJhd2luZyAqKiogKi9cbiAgbGV0IG1hcFN2ZyA9IGQzLnNlbGVjdCgnI21hcCBzdmcnKVxuICBsZXQgcGF0aCA9IGQzLmdlb1BhdGgoKVxuICBsZXQgdG9vbHRpcCA9IGQzLnNlbGVjdCgnI3Rvb2x0aXAnKVxuXG4gIC8qICoqKiBkcmF3IGxlZ2VuZCAqKiogKi9cbiAgbWFwU3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZFF1YW50JylcbiAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSg4MzAsMzAwKScpXG4gIGxldCBsZWdlbmQgPSBkMy5sZWdlbmRDb2xvcigpXG4gICAgLmxhYmVsRm9ybWF0KGQzLmZvcm1hdCgnLGQnKSlcbiAgICAudGl0bGUoJycpXG4gICAgLnRpdGxlV2lkdGgoMTAwKVxuICAgIC5jZWxscyg3KVxuICAgIC5zY2FsZShjb2xvcilcbiAgbWFwU3ZnLnNlbGVjdCgnLmxlZ2VuZFF1YW50JylcbiAgICAuY2FsbChsZWdlbmQpXG5cbiAgLyogKioqIGRyYXcgY291bnRpZXMgKioqICovXG4gIGxldCBjb3VudHltYXBlbCA9IG1hcFN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnRpZXMnKVxuICBjb3VudHltYXBlbC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgLmRhdGEodG9wb2pzb24uZmVhdHVyZShjb3VudGllcywgY291bnRpZXMub2JqZWN0cy5jb3VudGllcykuZmVhdHVyZXMpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignc3Ryb2tlJywgJyNmZmYnKVxuICAgICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgMC41KVxuICAgICAgICAuYXR0cignZmlsbCcsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgbGV0IG51bSA9IGdldFZhbChkLnByb3BlcnRpZXMuZ2VvaWQsIHllYXIsIGRpcmVjdGlvbilcbiAgICAgICAgICByZXR1cm4gbnVtID09PSBudWxsID8gJyNmZmYnIDogY29sb3IobnVtKVxuICAgICAgICB9KVxuICAgICAgICAuYXR0cignaWQnLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5nZW9pZCB9KVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgdHRPdmVyKVxuICAgICAgICAub24oJ21vdXNlbW92ZScsIHR0TW92ZSlcbiAgICAgICAgLm9uKCdtb3VzZW91dCcsIHR0T3V0KVxuXG4gIC8qICoqKiBkcmF3IHN0YXRlcyAqKiogKi9cbiAgbWFwU3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgMC41KVxuICAgICAgLmF0dHIoJ2QnLCBwYXRoKHRvcG9qc29uLm1lc2godXMsIHVzLm9iamVjdHMuc3RhdGVzKSkpXG5cbiAgLyoqIEBmdW5jdGlvbiBnZXRWYWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IGdlb2lkIC0gaWQgPSBgJHtzdGF0ZWZpcHN9JHtjb3VudHlmaXBzfWBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHllYXIgLSBvbmUgb2YgWycwNDA1JywgLi4uLCAnMTQxNSddXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gLSAnaW4nfHwnb3V0J1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdCAtIG9uZSBvZiBbJ24xJywgJ24yJywgJ2FnaSddXG4gICAqIEByZXR1cm5zIHs/bnVtYmVyfVxuICAgKiBAZGVzY3JpcHRpb24gUmV0dXJucyBlaXRoZXIgdGhlIHZhbHVlIGZvciB0aGUgcmVjb3JkIHdpdGggaWQ9Z2VvaWQgb3IgbnVsbFxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0VmFsIChnZW9pZCwgeWVhciwgZGlyZWN0aW9uLCBzdGF0ID0gJ24xJykge1xuICAgIGxldCB2YWwgPSBuZXN0ZWRDb3VudHlEYXRhW2RpcmVjdGlvbl1beWVhcl0uZmluZChlbCA9PiBlbC5pZCA9PT0gZ2VvaWQpXG4gICAgcmV0dXJuIHZhbCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHZhbFtzdGF0XVxuICB9XG5cbiAgLyogKioqIHRvb2x0aXAgaGFuZGxlciBmdW5jdGlvbnMgKioqICovXG4gIGZ1bmN0aW9uIHR0T3ZlciAoZCkge1xuICAgIGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKCdoaWdobGlnaHQnLCB0cnVlKVxuICB9XG4gIGZ1bmN0aW9uIHR0TW92ZSAoZCkge1xuICAgIGxldCBzdGF0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXQnKS52YWx1ZVxuICAgIHRvb2x0aXBcbiAgICAgICAgLnN0eWxlKCdsZWZ0JywgZDMuZXZlbnQucGFnZVggLSA1MCArICdweCcpXG4gICAgICAgIC5zdHlsZSgndG9wJywgZDMuZXZlbnQucGFnZVkgLSA3MCArICdweCcpXG4gICAgICAgIC5zdHlsZSgnZGlzcGxheScsICdpbmxpbmUtYmxvY2snKVxuICAgICAgICAuaHRtbChgPHN0cm9uZz4ke2QucHJvcGVydGllcy5uYW1lfSwgJHtkLnByb3BlcnRpZXMuc3RhdGV9PC9zdHJvbmc+OiA8c3Bhbj4ke2dldFZhbChkLnByb3BlcnRpZXMuZ2VvaWQsIHllYXIsIGRpcmVjdGlvbiwgc3RhdCl9PC9zcGFuPmApXG4gIH1cbiAgZnVuY3Rpb24gdHRPdXQgKGQpIHtcbiAgICB0b29sdGlwLnN0eWxlKCdkaXNwbGF5JywgJ25vbmUnKVxuICAgIGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKCdoaWdobGlnaHQnLCBmYWxzZSlcbiAgfVxuICAvKiAqKiogZW5kIG1hcCBkcmF3aW5nICoqKiAqL1xuXG4gIC8qICoqKiBzdGFydCBkcmF3IHRoZSBjb3VudGllcyBiYXJjaGFydCAqKiogKi9cbiAgbGV0IHRvcENvdW50eUVsZW1lbnQgPSBkaW1wbGUubmV3U3ZnKCcjcmFuay1jb3VudHknLCA5NjAsIDQwMClcbiAgdmFyIHRvcENvdW50eUNoYXJ0ID0gbmV3IGRpbXBsZS5jaGFydCh0b3BDb3VudHlFbGVtZW50LCBjaGFydERhdGEuY291bnRpZXMubjFbZGlyZWN0aW9uXVt5ZWFyXSlcbiAgdG9wQ291bnR5Q2hhcnQuc2V0TWFyZ2lucyg1MCwgMzAsIDMwLCAxNTApXG4gIHRvcENvdW50eUNoYXJ0LmFkZENhdGVnb3J5QXhpcygneCcsICduYW1lJykudGl0bGUgPSAnQ291bnR5J1xuICBsZXQgdG9wQ291bnR5Q2hhcnRZID0gdG9wQ291bnR5Q2hhcnQuYWRkTWVhc3VyZUF4aXMoJ3knLCAndmFsdWUnKVxuICB0b3BDb3VudHlDaGFydFkudGl0bGUgPSBzdGF0RnVsbE5hbWVbJ24xJ11cbiAgLy8gdG9wQ291bnR5Q2hhcnQuZGVmYXVsdENvbG9ycyA9IFtjb2xvclN3YXRjaGVzLmNoYXJ0W2RpcmVjdGlvbl1dXG4gIHRvcENvdW50eUNoYXJ0LmFkZFNlcmllcyhudWxsLCBkaW1wbGUucGxvdC5iYXIpXG4gIHRvcENvdW50eUNoYXJ0LmRyYXcoKVxuICAvKiAqKiogZW5kIGRyYXcgdGhlIGNvdW50aWVzIGJhcmNoYXJ0ICoqKiAqL1xuXG4gIC8qICoqKiBzdGFydCBkcmF3IHRoZSBvdXQgb2Ygc3RhdGUgY291bnRpZXMgYmFyY2hhcnQgKioqICovXG4gIGxldCB0b3BDb3VudHlPdXRPZlN0YXRlRWxlbWVudCA9IGRpbXBsZS5uZXdTdmcoJyNyYW5rLWNvdW50eS1vdXRvZnN0YXRlJywgOTYwLCA0MDApXG4gIHZhciB0b3BDb3VudHlPdXRPZlN0YXRlQ2hhcnQgPSBuZXcgZGltcGxlLmNoYXJ0KHRvcENvdW50eU91dE9mU3RhdGVFbGVtZW50LCBjaGFydERhdGEuY291bnRpZXMub3V0T2ZTdGF0ZS5uMVtkaXJlY3Rpb25dW3llYXJdKVxuICB0b3BDb3VudHlPdXRPZlN0YXRlQ2hhcnQuc2V0TWFyZ2lucyg1MCwgMzAsIDMwLCAxNTApXG4gIHRvcENvdW50eU91dE9mU3RhdGVDaGFydC5hZGRDYXRlZ29yeUF4aXMoJ3gnLCAnbmFtZScpLnRpdGxlID0gJ0NvdW50eSdcbiAgbGV0IHRvcENvdW50eU91dE9mU3RhdGVDaGFydFkgPSB0b3BDb3VudHlPdXRPZlN0YXRlQ2hhcnQuYWRkTWVhc3VyZUF4aXMoJ3knLCAndmFsdWUnKVxuICB0b3BDb3VudHlPdXRPZlN0YXRlQ2hhcnRZLnRpdGxlID0gc3RhdEZ1bGxOYW1lWyduMSddXG4gIC8vIHRvcENvdW50eU91dE9mU3RhdGVDaGFydC5kZWZhdWx0Q29sb3JzID0gW2NvbG9yU3dhdGNoZXMuY2hhcnRbZGlyZWN0aW9uXV1cbiAgdG9wQ291bnR5T3V0T2ZTdGF0ZUNoYXJ0LmFkZFNlcmllcyhudWxsLCBkaW1wbGUucGxvdC5iYXIpXG4gIHRvcENvdW50eU91dE9mU3RhdGVDaGFydC5kcmF3KClcbiAgLyogKioqIGVuZCBkcmF3IHRoZSBjb3VudGllcyBiYXJjaGFydCAqKiogKi9cblxuICAvKiAqKiogc3RhcnQgZHJhdyB0aGUgc3RhdGVzIGJhcmNoYXJ0ICoqKiAqL1xuICBsZXQgdG9wU3RhdGVFbGVtZW50ID0gZGltcGxlLm5ld1N2ZygnI3Jhbmstc3RhdGUnLCA5NjAsIDQwMClcbiAgdmFyIHRvcFN0YXRlQ2hhcnQgPSBuZXcgZGltcGxlLmNoYXJ0KHRvcFN0YXRlRWxlbWVudCwgY2hhcnREYXRhLnN0YXRlcy5uMVtkaXJlY3Rpb25dW3llYXJdLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuICAgIHJldHVybiBkLmZpcHMgIT09ICcwNidcbiAgfSkpXG4gIHRvcFN0YXRlQ2hhcnQuc2V0TWFyZ2lucyg1MCwgMzAsIDMwLCAxNTApXG4gIHRvcFN0YXRlQ2hhcnQuYWRkQ2F0ZWdvcnlBeGlzKCd4JywgJ25hbWUnKS50aXRsZSA9ICdTdGF0ZSdcbiAgLy8gbGV0IHRvcFN0YXRlQ2hhcnRZID0gdG9wU3RhdGVDaGFydC5hZGRMb2dBeGlzKCd5JywgJ3ZhbHVlJylcbiAgbGV0IHRvcFN0YXRlQ2hhcnRZID0gdG9wU3RhdGVDaGFydC5hZGRNZWFzdXJlQXhpcygneScsICd2YWx1ZScpXG4gIHRvcFN0YXRlQ2hhcnRZLnRpdGxlID0gc3RhdEZ1bGxOYW1lWyduMSddXG4gIC8vIHRvcFN0YXRlQ2hhcnQuZGVmYXVsdENvbG9ycyA9IFtjb2xvclN3YXRjaGVzLmNoYXJ0W2RpcmVjdGlvbl1dXG4gIHRvcFN0YXRlQ2hhcnQuYWRkU2VyaWVzKG51bGwsIGRpbXBsZS5wbG90LmJhcilcbiAgdG9wU3RhdGVDaGFydC5kcmF3KClcbiAgLyogKioqIGVuZCBkcmF3IHRoZSBzdGF0ZXMgYmFyY2hhcnQgKioqICovXG5cbiAgLyogKioqIHN0YXJ0IGRyYXcgdGhlIGxpbmVjaGFydCAqKiogKi9cbiAgbGV0IGFubnVhbERhdGEgPSBjaGFydERhdGEuY2hhcnRzLmxpbmVjaGFydFtkaXJlY3Rpb25dLkNBLm1hcChmdW5jdGlvbiAoZCkge1xuICAgIHJldHVybiB7eWVhcjogZC55ZWFyLCB2YWx1ZTogZFtkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdCcpLnZhbHVlXX1cbiAgfSlcbiAgbGV0IGFubnVhbEVsZW1lbnQgPSBkaW1wbGUubmV3U3ZnKCcjYW5udWFsJywgOTYwLCA0MDApXG4gIHZhciBhbm51YWxDaGFydCA9IG5ldyBkaW1wbGUuY2hhcnQoYW5udWFsRWxlbWVudCwgYW5udWFsRGF0YSlcbiAgYW5udWFsQ2hhcnQuc2V0TWFyZ2lucyg3MCwgMCwgNTAsIDQwKVxuICBhbm51YWxDaGFydC5hZGRDYXRlZ29yeUF4aXMoJ3gnLCAneWVhcicpLnRpdGxlID0gJ1llYXInXG4gIGxldCBhbm51YWxDaGFydFkgPSBhbm51YWxDaGFydC5hZGRBeGlzKCd5JywgJ3ZhbHVlJylcbiAgYW5udWFsQ2hhcnRZLnRpdGxlID0gc3RhdEZ1bGxOYW1lWyduMSddXG4gIGFubnVhbENoYXJ0LmFkZFNlcmllcyhudWxsLCBkaW1wbGUucGxvdC5saW5lKVxuICAvLyBhbm51YWxDaGFydC5kZWZhdWx0Q29sb3JzID0gW2NvbG9yU3dhdGNoZXMuY2hhcnRbZGlyZWN0aW9uXV1cbiAgYW5udWFsQ2hhcnQuZHJhdygpXG4gIC8qICoqKiBlbmQgZHJhdyB0aGUgbGluZWNoYXJ0ICoqKiAqL1xuXG4gIC8qICoqKiBiZWdpbiBwYWdlIGludGVyYWN0aW9uIGhhbmRsZXJzICoqKiAqL1xuICBzdGF0ZVNlbGVjdG9yLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHN0YXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdCcpLnZhbHVlXG4gICAgYW5udWFsQ2hhcnQuZGF0YSA9IGNoYXJ0RGF0YS5jaGFydHMubGluZWNoYXJ0W2RpcmVjdGlvbl1bdGhpcy52YWx1ZV0ubWFwKGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4ge3llYXI6IGQueWVhciwgdmFsdWU6IGRbc3RhdF19XG4gICAgfSlcbiAgICBhbm51YWxDaGFydC5kcmF3KClcbiAgfSlcbiAgeWVhclNlbGVjdG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VsZWN0ZWQteWVhcicpLmlubmVySFRNTCA9IGZ1bGxZZWFyKHllYXJzW3RoaXMudmFsdWVdKVxuICAgIGNoYW5nZUlucHV0KHllYXJzW3RoaXMudmFsdWVdLCBudWxsLCBudWxsKVxuICB9KVxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlyZWN0aW9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgIGNoYW5nZUlucHV0KG51bGwsIHRoaXMudmFsdWUsIG51bGwpXG4gIH0pXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0JykuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgIGNoYW5nZUlucHV0KG51bGwsIG51bGwsIHRoaXMudmFsdWUpXG4gIH0pXG5cbiAgZnVuY3Rpb24gY2hhbmdlSW5wdXQgKHllYXIsIGRpcmVjdGlvbiwgc3RhdCkge1xuICAgIGxldCBub3N0YXRldXBkYXRlID0gZmFsc2VcbiAgICBpZiAoeWVhcikgeyBub3N0YXRldXBkYXRlID0gdHJ1ZSB9XG4gICAgeWVhciA9IHllYXIgfHwgeWVhcnNbeWVhclNlbGVjdG9yLnZhbHVlXVxuICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbiB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGlyZWN0aW9uJykudmFsdWVcbiAgICBzdGF0ID0gc3RhdCB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhdCcpLnZhbHVlXG4gICAgbGV0IHN0YXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YXRleWVhcicpLnZhbHVlXG5cbiAgICBjb2xvclxuICAgICAgLmRvbWFpbihkb21haW5WYWxzKG5lc3RlZENvdW50eURhdGEsIGRpcmVjdGlvbiwgeWVhciwgc3RhdCkpXG4gICAgICAucmFuZ2UoY29sb3JTd2F0Y2hlc1tkaXJlY3Rpb25dKVxuXG4gICAgY291bnR5bWFwZWwuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgIC5hdHRyKCdmaWxsJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgbGV0IG51bSA9IGdldFZhbChkLnByb3BlcnRpZXMuZ2VvaWQsIHllYXIsIGRpcmVjdGlvbiwgc3RhdClcbiAgICAgICAgcmV0dXJuIGNvbG9yKG51bSlcbiAgICAgIH0pXG5cbiAgICBtYXBTdmcuc2VsZWN0KCcubGVnZW5kQ2VsbHMnKS5yZW1vdmUoKSAvLyB1cGRhdGUgZG9lc24ndCBzZWVtIHRvIGNhbGwgYSBjb2xvciBjaGFuZ2Ugb24gdGhlIGxlZ2VuZFxuICAgIGxlZ2VuZC5zY2FsZShjb2xvcilcbiAgICBtYXBTdmcuc2VsZWN0KCcubGVnZW5kUXVhbnQnKVxuICAgICAgLmNhbGwobGVnZW5kKVxuXG4gICAgLy8gdG9wQ291bnR5Q2hhcnQuZGVmYXVsdENvbG9ycyA9IFtjb2xvclN3YXRjaGVzLmNoYXJ0W2RpcmVjdGlvbl1dIC8vIHVzZSBjb2xvclNjYWxlIGluc3RlYWQgb2YgZGVmYXVsdENvbG9ycz9cbiAgICB0b3BDb3VudHlDaGFydC5kYXRhID0gY2hhcnREYXRhLmNvdW50aWVzW3N0YXRdW2RpcmVjdGlvbl1beWVhcl1cbiAgICB0b3BDb3VudHlDaGFydFkudGl0bGUgPSBzdGF0RnVsbE5hbWVbc3RhdF1cbiAgICB0b3BDb3VudHlDaGFydC5kcmF3KClcblxuICAgIHRvcFN0YXRlQ2hhcnQuZGF0YSA9IGNoYXJ0RGF0YS5zdGF0ZXNbc3RhdF1bZGlyZWN0aW9uXVt5ZWFyXS5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLmZpcHMgIT09ICcwNidcbiAgICB9KVxuICAgIC8vIHRvcFN0YXRlQ2hhcnQuZGVmYXVsdENvbG9ycyA9IFtjb2xvclN3YXRjaGVzLmNoYXJ0W2RpcmVjdGlvbl1dXG4gICAgdG9wU3RhdGVDaGFydFkudGl0bGUgPSBzdGF0RnVsbE5hbWVbc3RhdF1cbiAgICB0b3BTdGF0ZUNoYXJ0LmRyYXcoKVxuXG4gICAgdG9wQ291bnR5T3V0T2ZTdGF0ZUNoYXJ0LmRhdGEgPSBjaGFydERhdGEuY291bnRpZXMub3V0T2ZTdGF0ZVtzdGF0XVtkaXJlY3Rpb25dW3llYXJdXG4gICAgLy8gdG9wQ291bnR5T3V0T2ZTdGF0ZUNoYXJ0LmRlZmF1bHRDb2xvcnMgPSBbY29sb3JTd2F0Y2hlcy5jaGFydFtkaXJlY3Rpb25dXVxuICAgIHRvcENvdW50eU91dE9mU3RhdGVDaGFydFkudGl0bGUgPSBzdGF0RnVsbE5hbWVbc3RhdF1cbiAgICB0b3BDb3VudHlPdXRPZlN0YXRlQ2hhcnQuZHJhdygpXG5cbiAgICBpZiAoIW5vc3RhdGV1cGRhdGUpIHtcbiAgICAgIGFubnVhbENoYXJ0LmRhdGEgPSBjaGFydERhdGEuY2hhcnRzLmxpbmVjaGFydFtkaXJlY3Rpb25dW3N0YXRlXS5tYXAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIHt5ZWFyOiBkLnllYXIsIHZhbHVlOiBkW3N0YXRdfVxuICAgICAgfSlcbiAgICAgIGFubnVhbENoYXJ0WS50aXRsZSA9IHN0YXRGdWxsTmFtZVtzdGF0XVxuICAgICAgLy8gYW5udWFsQ2hhcnQuZGVmYXVsdENvbG9ycyA9IFtjb2xvclN3YXRjaGVzLmNoYXJ0W2RpcmVjdGlvbl1dXG4gICAgICBhbm51YWxDaGFydC5kcmF3KClcbiAgICB9XG4gIH1cbiAgLyogKioqIGVuZCBwYWdlIGludGVyYWN0aW9uIGhhbmRsZXJzICoqKiAqL1xufSAvKiAqKiogZW5kIGluaXRpYWxEcmF3ICoqKiAqL1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBkYXRhIG11bmdlIGhlbHBlciBmdW5jdGlvbnNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiogQGZ1bmN0aW9uIGRvbWFpblZhbHNcbiAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gbmVzdGVkQ291bnR5RGF0YVxuICogQHBhcmFtIHtzdHJpbmd9IGRpcmVjdGlvbiAtICdpbid8fCdvdXQnXG4gKiBAcGFyYW0ge3N0cmluZ30geWVhciAtIG9uZSBvZiBbJzA0MDUnLCAuLi4sICcxNDE1J11cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0IC0gb25lIG9mIFsnbjEnLCAnbjInLCAnYWdpJywgJ21lYW5BZ2knXVxuICogQHJldHVybnMge2FycmF5fSBhcnJheSBvZiBzdGF0IHZhbHVlcyBmb3IgdGhlIGRhdGEgaW4gdGhhdCBkaXJlY3Rpb24gJiB5ZWFyXG4gKi9cbmZ1bmN0aW9uIGRvbWFpblZhbHMgKGRhdGEsIGRpcmVjdGlvbiwgeWVhciwgc3RhdCkge1xuICByZXR1cm4gZGF0YVtkaXJlY3Rpb25dW3llYXJdLm1hcChkID0+IChkLnkxX3N0YXRlZmlwcyA8IDU4ICYmIGQuaWQgIT09IGZpcHNDb3VudHkgJiYgZFtzdGF0XSAhPT0gJy0xJykgPyArZFtzdGF0XSA6IG51bGwpXG59XG5cbi8qKiBAZnVuY3Rpb24gaW5Pck91dFxuICogQHBhcmFtIHsgb2JqZWN0IH0gZCAtIGQzLmNzdlBhcnNlJ2Qgcm93IG9mIGRhdGEgZnJvbSBgMDAwMDAwY29tYmluZWQuY3N2YCBmaWxlXG4gKiBAcmV0dXJucyB7IHN0cmluZyB9ICdpbicgb3IgJ291dCcsIG1lYW5pbmcgJ2ltbWlncmF0aW9uIGludG8nIG9yXG4gKiAnZW1pZ3JhdGlvbiBvdXQgb2YnIHRoZSBjb3VudHkgb2YgaW50ZXJlc3RcbiAqL1xuZnVuY3Rpb24gaW5Pck91dCAoZCkge1xuICByZXR1cm4gZC5pZCA9PT0gYCR7ZC55MV9zdGF0ZWZpcHN9JHtkLnkxX2NvdW50eWZpcHN9YCA/ICdpbicgOiAnb3V0J1xufVxuXG4vKiogQGZ1bmN0aW9uIGZ1bGxZZWFyXG4gKiBAcGFyYW0geyBzdHJpbmcgfSBkIC0gZXg6ICcwNDA1J1xuICogQHJldHVybnMgeyBzdHJpbmcgfSAtIGV4OiAnMjAwNC0yMDA1J1xuICogQGRlc2NyaXB0aW9uIGZvcm1hdHMgMmRpZ2l0LzJ5ZWFycyBzdHJpbmcgaW50byA0ZGlnaXQvMnllYXJzIHdpdGggaHlwaGVuXG4gKi9cbmZ1bmN0aW9uIGZ1bGxZZWFyIChkKSB7XG4gIGxldCByZXMgPSAvKFxcZHsyfSkoXFxkezJ9KS8uZXhlYyhkKVxuICByZXNbMV0gPSByZXNbMV0gPiA3OSA/IGAxOSR7cmVzWzFdfWAgOiBgMjAke3Jlc1sxXX1gXG4gIHJlc1syXSA9IHJlc1syXSA+IDc5ID8gYDE5JHtyZXNbMl19YCA6IGAyMCR7cmVzWzJdfWBcbiAgcmV0dXJuIGAke3Jlc1sxXX0tJHtyZXNbMl19YFxufVxuXG5sZXQgc3RhdEZ1bGxOYW1lID0ge1xuICBuMTogJ051bWJlciBvZiBSZXR1cm5zJyxcbiAgbjI6ICdOdW1iZXIgb2YgRXhlbXB0aW9ucycsXG4gIGFnaTogJ1RvdGFsIEFkanVzdGVkIEdyb3NzIEluY29tZScsXG4gIG1lYW5BZ2k6ICdNZWFuIEFkanVzdGVkIEdyb3NzIEluY29tZSdcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9pbmRleC5qcyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3N0eWxlLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gUHJlcGFyZSBjc3NUcmFuc2Zvcm1hdGlvblxudmFyIHRyYW5zZm9ybTtcblxudmFyIG9wdGlvbnMgPSB7fVxub3B0aW9ucy50cmFuc2Zvcm0gPSB0cmFuc2Zvcm1cbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCBvcHRpb25zKTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9zdHlsZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vc3R5bGUuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9zdHlsZS5jc3Ncbi8vIG1vZHVsZSBpZCA9IDFcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh1bmRlZmluZWQpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiYm9keSB7XFxuICAgIHBhZGRpbmc6IDA7XFxuICAgIG1hcmdpbjogMDtcXG59XFxuXFxuI3NpZGViYXIge1xcbiAgICBwb3NpdGlvbjogZml4ZWQ7XFxuICAgIHRvcDogMHB4O1xcbiAgICBsZWZ0OiAwcHg7XFxuICAgIGJvdHRvbTogMHB4O1xcbiAgICB3aWR0aDogMjAwcHg7XFxuICAgIG1hcmdpbi10b3A6IDUwcHg7XFxuICAgIG1hcmdpbi1sZWZ0OiAxMHB4O1xcbn1cXG5cXG4jY29udGFpbmVyIHtcXG4gICAgbWFyZ2luLXRvcDogNTBweDtcXG4gICAgbWFyZ2luLWxlZnQ6IDI1MHB4O1xcbn1cXG5cXG4jeWVhci1zZWxlY3RvciB7XFxuICAgd2lkdGg6IDIwMHB4O1xcbn1cXG5cXG4uaGlnaGxpZ2h0IHtcXG4gIGZpbGw6ICNhYzJlZTc7XFxuICAvKnN0cm9rZTogI2YwMDtcXG4gIHN0cm9rZS13aWR0aDogMnB4OyovXFxufVxcblxcbi5sZWdlbmRDZWxscyB7XFxuICBmaWxsOiAjMDAwO1xcbiAgc3Ryb2tlOiBub25lO1xcbn1cXG5cXG4uYXhpcyBwYXRoLFxcbi5heGlzIGxpbmUge1xcbiAgZmlsbDogbm9uZTtcXG4gIHN0cm9rZTogYmxhY2s7XFxuICBzaGFwZS1yZW5kZXJpbmc6IGNyaXNwRWRnZXM7XFxufVxcbi5heGlzIHRleHQge1xcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XFxuICBmb250LXNpemU6IDEycHg7XFxufVxcblxcbi5zZWxlY3Rvci1jb250cm9sIHtcXG4gIG1hcmdpbi10b3A6IDAuNXJlbTtcXG59XFxuXFxuI3NlbGVjdGVkLXllYXIge1xcbiAgYm9yZGVyOiAxcHggIzc4NzY3NiBzb2xpZDtcXG4gIHBhZGRpbmc6IDNweDtcXG4gIG1hcmdpbjogMCAycHg7XFxuICBib3JkZXItcmFkaXVzOiA0cHg7XFxufVxcblxcbi50b29sdGlwIHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIGRpc3BsYXk6IG5vbmU7XFxuICBtaW4td2lkdGg6IDgwcHg7XFxuICBoZWlnaHQ6IGF1dG87XFxuICBiYWNrZ3JvdW5kOiBub25lIHJlcGVhdCBzY3JvbGwgMCAwICNmZmZmZmY7XFxuICBib3JkZXI6IDFweCBzb2xpZCAjNzc3O1xcbiAgYm9yZGVyLXJhZGl1czogNXB4O1xcbiAgcGFkZGluZzogMTBweDtcXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcXG59XCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlciEuL3NyYy9zdHlsZS5jc3Ncbi8vIG1vZHVsZSBpZCA9IDJcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiLypcblx0TUlUIExpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblx0QXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxuKi9cbi8vIGNzcyBiYXNlIGNvZGUsIGluamVjdGVkIGJ5IHRoZSBjc3MtbG9hZGVyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVzZVNvdXJjZU1hcCkge1xuXHR2YXIgbGlzdCA9IFtdO1xuXG5cdC8vIHJldHVybiB0aGUgbGlzdCBvZiBtb2R1bGVzIGFzIGNzcyBzdHJpbmdcblx0bGlzdC50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuXHRcdHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuXHRcdFx0dmFyIGNvbnRlbnQgPSBjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKGl0ZW0sIHVzZVNvdXJjZU1hcCk7XG5cdFx0XHRpZihpdGVtWzJdKSB7XG5cdFx0XHRcdHJldHVybiBcIkBtZWRpYSBcIiArIGl0ZW1bMl0gKyBcIntcIiArIGNvbnRlbnQgKyBcIn1cIjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBjb250ZW50O1xuXHRcdFx0fVxuXHRcdH0pLmpvaW4oXCJcIik7XG5cdH07XG5cblx0Ly8gaW1wb3J0IGEgbGlzdCBvZiBtb2R1bGVzIGludG8gdGhlIGxpc3Rcblx0bGlzdC5pID0gZnVuY3Rpb24obW9kdWxlcywgbWVkaWFRdWVyeSkge1xuXHRcdGlmKHR5cGVvZiBtb2R1bGVzID09PSBcInN0cmluZ1wiKVxuXHRcdFx0bW9kdWxlcyA9IFtbbnVsbCwgbW9kdWxlcywgXCJcIl1dO1xuXHRcdHZhciBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzID0ge307XG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBpZCA9IHRoaXNbaV1bMF07XG5cdFx0XHRpZih0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIpXG5cdFx0XHRcdGFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaWRdID0gdHJ1ZTtcblx0XHR9XG5cdFx0Zm9yKGkgPSAwOyBpIDwgbW9kdWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGl0ZW0gPSBtb2R1bGVzW2ldO1xuXHRcdFx0Ly8gc2tpcCBhbHJlYWR5IGltcG9ydGVkIG1vZHVsZVxuXHRcdFx0Ly8gdGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBub3QgMTAwJSBwZXJmZWN0IGZvciB3ZWlyZCBtZWRpYSBxdWVyeSBjb21iaW5hdGlvbnNcblx0XHRcdC8vICB3aGVuIGEgbW9kdWxlIGlzIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IG1lZGlhIHF1ZXJpZXMuXG5cdFx0XHQvLyAgSSBob3BlIHRoaXMgd2lsbCBuZXZlciBvY2N1ciAoSGV5IHRoaXMgd2F5IHdlIGhhdmUgc21hbGxlciBidW5kbGVzKVxuXHRcdFx0aWYodHlwZW9mIGl0ZW1bMF0gIT09IFwibnVtYmVyXCIgfHwgIWFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaXRlbVswXV0pIHtcblx0XHRcdFx0aWYobWVkaWFRdWVyeSAmJiAhaXRlbVsyXSkge1xuXHRcdFx0XHRcdGl0ZW1bMl0gPSBtZWRpYVF1ZXJ5O1xuXHRcdFx0XHR9IGVsc2UgaWYobWVkaWFRdWVyeSkge1xuXHRcdFx0XHRcdGl0ZW1bMl0gPSBcIihcIiArIGl0ZW1bMl0gKyBcIikgYW5kIChcIiArIG1lZGlhUXVlcnkgKyBcIilcIjtcblx0XHRcdFx0fVxuXHRcdFx0XHRsaXN0LnB1c2goaXRlbSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gbGlzdDtcbn07XG5cbmZ1bmN0aW9uIGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSwgdXNlU291cmNlTWFwKSB7XG5cdHZhciBjb250ZW50ID0gaXRlbVsxXSB8fCAnJztcblx0dmFyIGNzc01hcHBpbmcgPSBpdGVtWzNdO1xuXHRpZiAoIWNzc01hcHBpbmcpIHtcblx0XHRyZXR1cm4gY29udGVudDtcblx0fVxuXG5cdGlmICh1c2VTb3VyY2VNYXAgJiYgdHlwZW9mIGJ0b2EgPT09ICdmdW5jdGlvbicpIHtcblx0XHR2YXIgc291cmNlTWFwcGluZyA9IHRvQ29tbWVudChjc3NNYXBwaW5nKTtcblx0XHR2YXIgc291cmNlVVJMcyA9IGNzc01hcHBpbmcuc291cmNlcy5tYXAoZnVuY3Rpb24gKHNvdXJjZSkge1xuXHRcdFx0cmV0dXJuICcvKiMgc291cmNlVVJMPScgKyBjc3NNYXBwaW5nLnNvdXJjZVJvb3QgKyBzb3VyY2UgKyAnICovJ1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFtjb250ZW50XS5jb25jYXQoc291cmNlVVJMcykuY29uY2F0KFtzb3VyY2VNYXBwaW5nXSkuam9pbignXFxuJyk7XG5cdH1cblxuXHRyZXR1cm4gW2NvbnRlbnRdLmpvaW4oJ1xcbicpO1xufVxuXG4vLyBBZGFwdGVkIGZyb20gY29udmVydC1zb3VyY2UtbWFwIChNSVQpXG5mdW5jdGlvbiB0b0NvbW1lbnQoc291cmNlTWFwKSB7XG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuXHR2YXIgYmFzZTY0ID0gYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSkpKTtcblx0dmFyIGRhdGEgPSAnc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsJyArIGJhc2U2NDtcblxuXHRyZXR1cm4gJy8qIyAnICsgZGF0YSArICcgKi8nO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcbi8vIG1vZHVsZSBpZCA9IDNcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiLypcblx0TUlUIExpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblx0QXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxuKi9cblxudmFyIHN0eWxlc0luRG9tID0ge307XG5cbnZhclx0bWVtb2l6ZSA9IGZ1bmN0aW9uIChmbikge1xuXHR2YXIgbWVtbztcblxuXHRyZXR1cm4gZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0eXBlb2YgbWVtbyA9PT0gXCJ1bmRlZmluZWRcIikgbWVtbyA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0cmV0dXJuIG1lbW87XG5cdH07XG59O1xuXG52YXIgaXNPbGRJRSA9IG1lbW9pemUoZnVuY3Rpb24gKCkge1xuXHQvLyBUZXN0IGZvciBJRSA8PSA5IGFzIHByb3Bvc2VkIGJ5IEJyb3dzZXJoYWNrc1xuXHQvLyBAc2VlIGh0dHA6Ly9icm93c2VyaGFja3MuY29tLyNoYWNrLWU3MWQ4NjkyZjY1MzM0MTczZmVlNzE1YzIyMmNiODA1XG5cdC8vIFRlc3RzIGZvciBleGlzdGVuY2Ugb2Ygc3RhbmRhcmQgZ2xvYmFscyBpcyB0byBhbGxvdyBzdHlsZS1sb2FkZXJcblx0Ly8gdG8gb3BlcmF0ZSBjb3JyZWN0bHkgaW50byBub24tc3RhbmRhcmQgZW52aXJvbm1lbnRzXG5cdC8vIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2stY29udHJpYi9zdHlsZS1sb2FkZXIvaXNzdWVzLzE3N1xuXHRyZXR1cm4gd2luZG93ICYmIGRvY3VtZW50ICYmIGRvY3VtZW50LmFsbCAmJiAhd2luZG93LmF0b2I7XG59KTtcblxudmFyIGdldEVsZW1lbnQgPSAoZnVuY3Rpb24gKGZuKSB7XG5cdHZhciBtZW1vID0ge307XG5cblx0cmV0dXJuIGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG5cdFx0aWYgKHR5cGVvZiBtZW1vW3NlbGVjdG9yXSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0bWVtb1tzZWxlY3Rvcl0gPSBmbi5jYWxsKHRoaXMsIHNlbGVjdG9yKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbWVtb1tzZWxlY3Rvcl1cblx0fTtcbn0pKGZ1bmN0aW9uICh0YXJnZXQpIHtcblx0cmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0KVxufSk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xudmFyXHRzaW5nbGV0b25Db3VudGVyID0gMDtcbnZhclx0c3R5bGVzSW5zZXJ0ZWRBdFRvcCA9IFtdO1xuXG52YXJcdGZpeFVybHMgPSByZXF1aXJlKFwiLi91cmxzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGxpc3QsIG9wdGlvbnMpIHtcblx0aWYgKHR5cGVvZiBERUJVRyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBERUJVRykge1xuXHRcdGlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwib2JqZWN0XCIpIHRocm93IG5ldyBFcnJvcihcIlRoZSBzdHlsZS1sb2FkZXIgY2Fubm90IGJlIHVzZWQgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudFwiKTtcblx0fVxuXG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdG9wdGlvbnMuYXR0cnMgPSB0eXBlb2Ygb3B0aW9ucy5hdHRycyA9PT0gXCJvYmplY3RcIiA/IG9wdGlvbnMuYXR0cnMgOiB7fTtcblxuXHQvLyBGb3JjZSBzaW5nbGUtdGFnIHNvbHV0aW9uIG9uIElFNi05LCB3aGljaCBoYXMgYSBoYXJkIGxpbWl0IG9uIHRoZSAjIG9mIDxzdHlsZT5cblx0Ly8gdGFncyBpdCB3aWxsIGFsbG93IG9uIGEgcGFnZVxuXHRpZiAoIW9wdGlvbnMuc2luZ2xldG9uKSBvcHRpb25zLnNpbmdsZXRvbiA9IGlzT2xkSUUoKTtcblxuXHQvLyBCeSBkZWZhdWx0LCBhZGQgPHN0eWxlPiB0YWdzIHRvIHRoZSA8aGVhZD4gZWxlbWVudFxuXHRpZiAoIW9wdGlvbnMuaW5zZXJ0SW50bykgb3B0aW9ucy5pbnNlcnRJbnRvID0gXCJoZWFkXCI7XG5cblx0Ly8gQnkgZGVmYXVsdCwgYWRkIDxzdHlsZT4gdGFncyB0byB0aGUgYm90dG9tIG9mIHRoZSB0YXJnZXRcblx0aWYgKCFvcHRpb25zLmluc2VydEF0KSBvcHRpb25zLmluc2VydEF0ID0gXCJib3R0b21cIjtcblxuXHR2YXIgc3R5bGVzID0gbGlzdFRvU3R5bGVzKGxpc3QsIG9wdGlvbnMpO1xuXG5cdGFkZFN0eWxlc1RvRG9tKHN0eWxlcywgb3B0aW9ucyk7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAobmV3TGlzdCkge1xuXHRcdHZhciBtYXlSZW1vdmUgPSBbXTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3R5bGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgaXRlbSA9IHN0eWxlc1tpXTtcblx0XHRcdHZhciBkb21TdHlsZSA9IHN0eWxlc0luRG9tW2l0ZW0uaWRdO1xuXG5cdFx0XHRkb21TdHlsZS5yZWZzLS07XG5cdFx0XHRtYXlSZW1vdmUucHVzaChkb21TdHlsZSk7XG5cdFx0fVxuXG5cdFx0aWYobmV3TGlzdCkge1xuXHRcdFx0dmFyIG5ld1N0eWxlcyA9IGxpc3RUb1N0eWxlcyhuZXdMaXN0LCBvcHRpb25zKTtcblx0XHRcdGFkZFN0eWxlc1RvRG9tKG5ld1N0eWxlcywgb3B0aW9ucyk7XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBtYXlSZW1vdmUubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBkb21TdHlsZSA9IG1heVJlbW92ZVtpXTtcblxuXHRcdFx0aWYoZG9tU3R5bGUucmVmcyA9PT0gMCkge1xuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGRvbVN0eWxlLnBhcnRzLmxlbmd0aDsgaisrKSBkb21TdHlsZS5wYXJ0c1tqXSgpO1xuXG5cdFx0XHRcdGRlbGV0ZSBzdHlsZXNJbkRvbVtkb21TdHlsZS5pZF07XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xufTtcblxuZnVuY3Rpb24gYWRkU3R5bGVzVG9Eb20gKHN0eWxlcywgb3B0aW9ucykge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpdGVtID0gc3R5bGVzW2ldO1xuXHRcdHZhciBkb21TdHlsZSA9IHN0eWxlc0luRG9tW2l0ZW0uaWRdO1xuXG5cdFx0aWYoZG9tU3R5bGUpIHtcblx0XHRcdGRvbVN0eWxlLnJlZnMrKztcblxuXHRcdFx0Zm9yKHZhciBqID0gMDsgaiA8IGRvbVN0eWxlLnBhcnRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGRvbVN0eWxlLnBhcnRzW2pdKGl0ZW0ucGFydHNbal0pO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IoOyBqIDwgaXRlbS5wYXJ0cy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRkb21TdHlsZS5wYXJ0cy5wdXNoKGFkZFN0eWxlKGl0ZW0ucGFydHNbal0sIG9wdGlvbnMpKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIHBhcnRzID0gW107XG5cblx0XHRcdGZvcih2YXIgaiA9IDA7IGogPCBpdGVtLnBhcnRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHBhcnRzLnB1c2goYWRkU3R5bGUoaXRlbS5wYXJ0c1tqXSwgb3B0aW9ucykpO1xuXHRcdFx0fVxuXG5cdFx0XHRzdHlsZXNJbkRvbVtpdGVtLmlkXSA9IHtpZDogaXRlbS5pZCwgcmVmczogMSwgcGFydHM6IHBhcnRzfTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gbGlzdFRvU3R5bGVzIChsaXN0LCBvcHRpb25zKSB7XG5cdHZhciBzdHlsZXMgPSBbXTtcblx0dmFyIG5ld1N0eWxlcyA9IHt9O1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpdGVtID0gbGlzdFtpXTtcblx0XHR2YXIgaWQgPSBvcHRpb25zLmJhc2UgPyBpdGVtWzBdICsgb3B0aW9ucy5iYXNlIDogaXRlbVswXTtcblx0XHR2YXIgY3NzID0gaXRlbVsxXTtcblx0XHR2YXIgbWVkaWEgPSBpdGVtWzJdO1xuXHRcdHZhciBzb3VyY2VNYXAgPSBpdGVtWzNdO1xuXHRcdHZhciBwYXJ0ID0ge2NzczogY3NzLCBtZWRpYTogbWVkaWEsIHNvdXJjZU1hcDogc291cmNlTWFwfTtcblxuXHRcdGlmKCFuZXdTdHlsZXNbaWRdKSBzdHlsZXMucHVzaChuZXdTdHlsZXNbaWRdID0ge2lkOiBpZCwgcGFydHM6IFtwYXJ0XX0pO1xuXHRcdGVsc2UgbmV3U3R5bGVzW2lkXS5wYXJ0cy5wdXNoKHBhcnQpO1xuXHR9XG5cblx0cmV0dXJuIHN0eWxlcztcbn1cblxuZnVuY3Rpb24gaW5zZXJ0U3R5bGVFbGVtZW50IChvcHRpb25zLCBzdHlsZSkge1xuXHR2YXIgdGFyZ2V0ID0gZ2V0RWxlbWVudChvcHRpb25zLmluc2VydEludG8pXG5cblx0aWYgKCF0YXJnZXQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBmaW5kIGEgc3R5bGUgdGFyZ2V0LiBUaGlzIHByb2JhYmx5IG1lYW5zIHRoYXQgdGhlIHZhbHVlIGZvciB0aGUgJ2luc2VydEludG8nIHBhcmFtZXRlciBpcyBpbnZhbGlkLlwiKTtcblx0fVxuXG5cdHZhciBsYXN0U3R5bGVFbGVtZW50SW5zZXJ0ZWRBdFRvcCA9IHN0eWxlc0luc2VydGVkQXRUb3Bbc3R5bGVzSW5zZXJ0ZWRBdFRvcC5sZW5ndGggLSAxXTtcblxuXHRpZiAob3B0aW9ucy5pbnNlcnRBdCA9PT0gXCJ0b3BcIikge1xuXHRcdGlmICghbGFzdFN0eWxlRWxlbWVudEluc2VydGVkQXRUb3ApIHtcblx0XHRcdHRhcmdldC5pbnNlcnRCZWZvcmUoc3R5bGUsIHRhcmdldC5maXJzdENoaWxkKTtcblx0XHR9IGVsc2UgaWYgKGxhc3RTdHlsZUVsZW1lbnRJbnNlcnRlZEF0VG9wLm5leHRTaWJsaW5nKSB7XG5cdFx0XHR0YXJnZXQuaW5zZXJ0QmVmb3JlKHN0eWxlLCBsYXN0U3R5bGVFbGVtZW50SW5zZXJ0ZWRBdFRvcC5uZXh0U2libGluZyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRhcmdldC5hcHBlbmRDaGlsZChzdHlsZSk7XG5cdFx0fVxuXHRcdHN0eWxlc0luc2VydGVkQXRUb3AucHVzaChzdHlsZSk7XG5cdH0gZWxzZSBpZiAob3B0aW9ucy5pbnNlcnRBdCA9PT0gXCJib3R0b21cIikge1xuXHRcdHRhcmdldC5hcHBlbmRDaGlsZChzdHlsZSk7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB2YWx1ZSBmb3IgcGFyYW1ldGVyICdpbnNlcnRBdCcuIE11c3QgYmUgJ3RvcCcgb3IgJ2JvdHRvbScuXCIpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVN0eWxlRWxlbWVudCAoc3R5bGUpIHtcblx0aWYgKHN0eWxlLnBhcmVudE5vZGUgPT09IG51bGwpIHJldHVybiBmYWxzZTtcblx0c3R5bGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzdHlsZSk7XG5cblx0dmFyIGlkeCA9IHN0eWxlc0luc2VydGVkQXRUb3AuaW5kZXhPZihzdHlsZSk7XG5cdGlmKGlkeCA+PSAwKSB7XG5cdFx0c3R5bGVzSW5zZXJ0ZWRBdFRvcC5zcGxpY2UoaWR4LCAxKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTdHlsZUVsZW1lbnQgKG9wdGlvbnMpIHtcblx0dmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXG5cdG9wdGlvbnMuYXR0cnMudHlwZSA9IFwidGV4dC9jc3NcIjtcblxuXHRhZGRBdHRycyhzdHlsZSwgb3B0aW9ucy5hdHRycyk7XG5cdGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zLCBzdHlsZSk7XG5cblx0cmV0dXJuIHN0eWxlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMaW5rRWxlbWVudCAob3B0aW9ucykge1xuXHR2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpO1xuXG5cdG9wdGlvbnMuYXR0cnMudHlwZSA9IFwidGV4dC9jc3NcIjtcblx0b3B0aW9ucy5hdHRycy5yZWwgPSBcInN0eWxlc2hlZXRcIjtcblxuXHRhZGRBdHRycyhsaW5rLCBvcHRpb25zLmF0dHJzKTtcblx0aW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMsIGxpbmspO1xuXG5cdHJldHVybiBsaW5rO1xufVxuXG5mdW5jdGlvbiBhZGRBdHRycyAoZWwsIGF0dHJzKSB7XG5cdE9iamVjdC5rZXlzKGF0dHJzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRlbC5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyc1trZXldKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFkZFN0eWxlIChvYmosIG9wdGlvbnMpIHtcblx0dmFyIHN0eWxlLCB1cGRhdGUsIHJlbW92ZSwgcmVzdWx0O1xuXG5cdC8vIElmIGEgdHJhbnNmb3JtIGZ1bmN0aW9uIHdhcyBkZWZpbmVkLCBydW4gaXQgb24gdGhlIGNzc1xuXHRpZiAob3B0aW9ucy50cmFuc2Zvcm0gJiYgb2JqLmNzcykge1xuXHQgICAgcmVzdWx0ID0gb3B0aW9ucy50cmFuc2Zvcm0ob2JqLmNzcyk7XG5cblx0ICAgIGlmIChyZXN1bHQpIHtcblx0ICAgIFx0Ly8gSWYgdHJhbnNmb3JtIHJldHVybnMgYSB2YWx1ZSwgdXNlIHRoYXQgaW5zdGVhZCBvZiB0aGUgb3JpZ2luYWwgY3NzLlxuXHQgICAgXHQvLyBUaGlzIGFsbG93cyBydW5uaW5nIHJ1bnRpbWUgdHJhbnNmb3JtYXRpb25zIG9uIHRoZSBjc3MuXG5cdCAgICBcdG9iai5jc3MgPSByZXN1bHQ7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgXHQvLyBJZiB0aGUgdHJhbnNmb3JtIGZ1bmN0aW9uIHJldHVybnMgYSBmYWxzeSB2YWx1ZSwgZG9uJ3QgYWRkIHRoaXMgY3NzLlxuXHQgICAgXHQvLyBUaGlzIGFsbG93cyBjb25kaXRpb25hbCBsb2FkaW5nIG9mIGNzc1xuXHQgICAgXHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICBcdFx0Ly8gbm9vcFxuXHQgICAgXHR9O1xuXHQgICAgfVxuXHR9XG5cblx0aWYgKG9wdGlvbnMuc2luZ2xldG9uKSB7XG5cdFx0dmFyIHN0eWxlSW5kZXggPSBzaW5nbGV0b25Db3VudGVyKys7XG5cblx0XHRzdHlsZSA9IHNpbmdsZXRvbiB8fCAoc2luZ2xldG9uID0gY3JlYXRlU3R5bGVFbGVtZW50KG9wdGlvbnMpKTtcblxuXHRcdHVwZGF0ZSA9IGFwcGx5VG9TaW5nbGV0b25UYWcuYmluZChudWxsLCBzdHlsZSwgc3R5bGVJbmRleCwgZmFsc2UpO1xuXHRcdHJlbW92ZSA9IGFwcGx5VG9TaW5nbGV0b25UYWcuYmluZChudWxsLCBzdHlsZSwgc3R5bGVJbmRleCwgdHJ1ZSk7XG5cblx0fSBlbHNlIGlmIChcblx0XHRvYmouc291cmNlTWFwICYmXG5cdFx0dHlwZW9mIFVSTCA9PT0gXCJmdW5jdGlvblwiICYmXG5cdFx0dHlwZW9mIFVSTC5jcmVhdGVPYmplY3RVUkwgPT09IFwiZnVuY3Rpb25cIiAmJlxuXHRcdHR5cGVvZiBVUkwucmV2b2tlT2JqZWN0VVJMID09PSBcImZ1bmN0aW9uXCIgJiZcblx0XHR0eXBlb2YgQmxvYiA9PT0gXCJmdW5jdGlvblwiICYmXG5cdFx0dHlwZW9mIGJ0b2EgPT09IFwiZnVuY3Rpb25cIlxuXHQpIHtcblx0XHRzdHlsZSA9IGNyZWF0ZUxpbmtFbGVtZW50KG9wdGlvbnMpO1xuXHRcdHVwZGF0ZSA9IHVwZGF0ZUxpbmsuYmluZChudWxsLCBzdHlsZSwgb3B0aW9ucyk7XG5cdFx0cmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmVtb3ZlU3R5bGVFbGVtZW50KHN0eWxlKTtcblxuXHRcdFx0aWYoc3R5bGUuaHJlZikgVVJMLnJldm9rZU9iamVjdFVSTChzdHlsZS5ocmVmKTtcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdHN0eWxlID0gY3JlYXRlU3R5bGVFbGVtZW50KG9wdGlvbnMpO1xuXHRcdHVwZGF0ZSA9IGFwcGx5VG9UYWcuYmluZChudWxsLCBzdHlsZSk7XG5cdFx0cmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmVtb3ZlU3R5bGVFbGVtZW50KHN0eWxlKTtcblx0XHR9O1xuXHR9XG5cblx0dXBkYXRlKG9iaik7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZVN0eWxlIChuZXdPYmopIHtcblx0XHRpZiAobmV3T2JqKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdG5ld09iai5jc3MgPT09IG9iai5jc3MgJiZcblx0XHRcdFx0bmV3T2JqLm1lZGlhID09PSBvYmoubWVkaWEgJiZcblx0XHRcdFx0bmV3T2JqLnNvdXJjZU1hcCA9PT0gb2JqLnNvdXJjZU1hcFxuXHRcdFx0KSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dXBkYXRlKG9iaiA9IG5ld09iaik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlbW92ZSgpO1xuXHRcdH1cblx0fTtcbn1cblxudmFyIHJlcGxhY2VUZXh0ID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIHRleHRTdG9yZSA9IFtdO1xuXG5cdHJldHVybiBmdW5jdGlvbiAoaW5kZXgsIHJlcGxhY2VtZW50KSB7XG5cdFx0dGV4dFN0b3JlW2luZGV4XSA9IHJlcGxhY2VtZW50O1xuXG5cdFx0cmV0dXJuIHRleHRTdG9yZS5maWx0ZXIoQm9vbGVhbikuam9pbignXFxuJyk7XG5cdH07XG59KSgpO1xuXG5mdW5jdGlvbiBhcHBseVRvU2luZ2xldG9uVGFnIChzdHlsZSwgaW5kZXgsIHJlbW92ZSwgb2JqKSB7XG5cdHZhciBjc3MgPSByZW1vdmUgPyBcIlwiIDogb2JqLmNzcztcblxuXHRpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuXHRcdHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHJlcGxhY2VUZXh0KGluZGV4LCBjc3MpO1xuXHR9IGVsc2Uge1xuXHRcdHZhciBjc3NOb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKTtcblx0XHR2YXIgY2hpbGROb2RlcyA9IHN0eWxlLmNoaWxkTm9kZXM7XG5cblx0XHRpZiAoY2hpbGROb2Rlc1tpbmRleF0pIHN0eWxlLnJlbW92ZUNoaWxkKGNoaWxkTm9kZXNbaW5kZXhdKTtcblxuXHRcdGlmIChjaGlsZE5vZGVzLmxlbmd0aCkge1xuXHRcdFx0c3R5bGUuaW5zZXJ0QmVmb3JlKGNzc05vZGUsIGNoaWxkTm9kZXNbaW5kZXhdKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3R5bGUuYXBwZW5kQ2hpbGQoY3NzTm9kZSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGFwcGx5VG9UYWcgKHN0eWxlLCBvYmopIHtcblx0dmFyIGNzcyA9IG9iai5jc3M7XG5cdHZhciBtZWRpYSA9IG9iai5tZWRpYTtcblxuXHRpZihtZWRpYSkge1xuXHRcdHN0eWxlLnNldEF0dHJpYnV0ZShcIm1lZGlhXCIsIG1lZGlhKVxuXHR9XG5cblx0aWYoc3R5bGUuc3R5bGVTaGVldCkge1xuXHRcdHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcblx0fSBlbHNlIHtcblx0XHR3aGlsZShzdHlsZS5maXJzdENoaWxkKSB7XG5cdFx0XHRzdHlsZS5yZW1vdmVDaGlsZChzdHlsZS5maXJzdENoaWxkKTtcblx0XHR9XG5cblx0XHRzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpKTtcblx0fVxufVxuXG5mdW5jdGlvbiB1cGRhdGVMaW5rIChsaW5rLCBvcHRpb25zLCBvYmopIHtcblx0dmFyIGNzcyA9IG9iai5jc3M7XG5cdHZhciBzb3VyY2VNYXAgPSBvYmouc291cmNlTWFwO1xuXG5cdC8qXG5cdFx0SWYgY29udmVydFRvQWJzb2x1dGVVcmxzIGlzbid0IGRlZmluZWQsIGJ1dCBzb3VyY2VtYXBzIGFyZSBlbmFibGVkXG5cdFx0YW5kIHRoZXJlIGlzIG5vIHB1YmxpY1BhdGggZGVmaW5lZCB0aGVuIGxldHMgdHVybiBjb252ZXJ0VG9BYnNvbHV0ZVVybHNcblx0XHRvbiBieSBkZWZhdWx0LiAgT3RoZXJ3aXNlIGRlZmF1bHQgdG8gdGhlIGNvbnZlcnRUb0Fic29sdXRlVXJscyBvcHRpb25cblx0XHRkaXJlY3RseVxuXHQqL1xuXHR2YXIgYXV0b0ZpeFVybHMgPSBvcHRpb25zLmNvbnZlcnRUb0Fic29sdXRlVXJscyA9PT0gdW5kZWZpbmVkICYmIHNvdXJjZU1hcDtcblxuXHRpZiAob3B0aW9ucy5jb252ZXJ0VG9BYnNvbHV0ZVVybHMgfHwgYXV0b0ZpeFVybHMpIHtcblx0XHRjc3MgPSBmaXhVcmxzKGNzcyk7XG5cdH1cblxuXHRpZiAoc291cmNlTWFwKSB7XG5cdFx0Ly8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjY2MDM4NzVcblx0XHRjc3MgKz0gXCJcXG4vKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LFwiICsgYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSkpKSArIFwiICovXCI7XG5cdH1cblxuXHR2YXIgYmxvYiA9IG5ldyBCbG9iKFtjc3NdLCB7IHR5cGU6IFwidGV4dC9jc3NcIiB9KTtcblxuXHR2YXIgb2xkU3JjID0gbGluay5ocmVmO1xuXG5cdGxpbmsuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cblx0aWYob2xkU3JjKSBVUkwucmV2b2tlT2JqZWN0VVJMKG9sZFNyYyk7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlcy5qc1xuLy8gbW9kdWxlIGlkID0gNFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJcbi8qKlxuICogV2hlbiBzb3VyY2UgbWFwcyBhcmUgZW5hYmxlZCwgYHN0eWxlLWxvYWRlcmAgdXNlcyBhIGxpbmsgZWxlbWVudCB3aXRoIGEgZGF0YS11cmkgdG9cbiAqIGVtYmVkIHRoZSBjc3Mgb24gdGhlIHBhZ2UuIFRoaXMgYnJlYWtzIGFsbCByZWxhdGl2ZSB1cmxzIGJlY2F1c2Ugbm93IHRoZXkgYXJlIHJlbGF0aXZlIHRvIGFcbiAqIGJ1bmRsZSBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IHBhZ2UuXG4gKlxuICogT25lIHNvbHV0aW9uIGlzIHRvIG9ubHkgdXNlIGZ1bGwgdXJscywgYnV0IHRoYXQgbWF5IGJlIGltcG9zc2libGUuXG4gKlxuICogSW5zdGVhZCwgdGhpcyBmdW5jdGlvbiBcImZpeGVzXCIgdGhlIHJlbGF0aXZlIHVybHMgdG8gYmUgYWJzb2x1dGUgYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50IHBhZ2UgbG9jYXRpb24uXG4gKlxuICogQSBydWRpbWVudGFyeSB0ZXN0IHN1aXRlIGlzIGxvY2F0ZWQgYXQgYHRlc3QvZml4VXJscy5qc2AgYW5kIGNhbiBiZSBydW4gdmlhIHRoZSBgbnBtIHRlc3RgIGNvbW1hbmQuXG4gKlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNzcykge1xuICAvLyBnZXQgY3VycmVudCBsb2NhdGlvblxuICB2YXIgbG9jYXRpb24gPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy5sb2NhdGlvbjtcblxuICBpZiAoIWxvY2F0aW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiZml4VXJscyByZXF1aXJlcyB3aW5kb3cubG9jYXRpb25cIik7XG4gIH1cblxuXHQvLyBibGFuayBvciBudWxsP1xuXHRpZiAoIWNzcyB8fCB0eXBlb2YgY3NzICE9PSBcInN0cmluZ1wiKSB7XG5cdCAgcmV0dXJuIGNzcztcbiAgfVxuXG4gIHZhciBiYXNlVXJsID0gbG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyBsb2NhdGlvbi5ob3N0O1xuICB2YXIgY3VycmVudERpciA9IGJhc2VVcmwgKyBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9cXC9bXlxcL10qJC8sIFwiL1wiKTtcblxuXHQvLyBjb252ZXJ0IGVhY2ggdXJsKC4uLilcblx0Lypcblx0VGhpcyByZWd1bGFyIGV4cHJlc3Npb24gaXMganVzdCBhIHdheSB0byByZWN1cnNpdmVseSBtYXRjaCBicmFja2V0cyB3aXRoaW5cblx0YSBzdHJpbmcuXG5cblx0IC91cmxcXHMqXFwoICA9IE1hdGNoIG9uIHRoZSB3b3JkIFwidXJsXCIgd2l0aCBhbnkgd2hpdGVzcGFjZSBhZnRlciBpdCBhbmQgdGhlbiBhIHBhcmVuc1xuXHQgICAoICA9IFN0YXJ0IGEgY2FwdHVyaW5nIGdyb3VwXG5cdCAgICAgKD86ICA9IFN0YXJ0IGEgbm9uLWNhcHR1cmluZyBncm91cFxuXHQgICAgICAgICBbXikoXSAgPSBNYXRjaCBhbnl0aGluZyB0aGF0IGlzbid0IGEgcGFyZW50aGVzZXNcblx0ICAgICAgICAgfCAgPSBPUlxuXHQgICAgICAgICBcXCggID0gTWF0Y2ggYSBzdGFydCBwYXJlbnRoZXNlc1xuXHQgICAgICAgICAgICAgKD86ICA9IFN0YXJ0IGFub3RoZXIgbm9uLWNhcHR1cmluZyBncm91cHNcblx0ICAgICAgICAgICAgICAgICBbXikoXSsgID0gTWF0Y2ggYW55dGhpbmcgdGhhdCBpc24ndCBhIHBhcmVudGhlc2VzXG5cdCAgICAgICAgICAgICAgICAgfCAgPSBPUlxuXHQgICAgICAgICAgICAgICAgIFxcKCAgPSBNYXRjaCBhIHN0YXJ0IHBhcmVudGhlc2VzXG5cdCAgICAgICAgICAgICAgICAgICAgIFteKShdKiAgPSBNYXRjaCBhbnl0aGluZyB0aGF0IGlzbid0IGEgcGFyZW50aGVzZXNcblx0ICAgICAgICAgICAgICAgICBcXCkgID0gTWF0Y2ggYSBlbmQgcGFyZW50aGVzZXNcblx0ICAgICAgICAgICAgICkgID0gRW5kIEdyb3VwXG4gICAgICAgICAgICAgICpcXCkgPSBNYXRjaCBhbnl0aGluZyBhbmQgdGhlbiBhIGNsb3NlIHBhcmVuc1xuICAgICAgICAgICkgID0gQ2xvc2Ugbm9uLWNhcHR1cmluZyBncm91cFxuICAgICAgICAgICogID0gTWF0Y2ggYW55dGhpbmdcbiAgICAgICApICA9IENsb3NlIGNhcHR1cmluZyBncm91cFxuXHQgXFwpICA9IE1hdGNoIGEgY2xvc2UgcGFyZW5zXG5cblx0IC9naSAgPSBHZXQgYWxsIG1hdGNoZXMsIG5vdCB0aGUgZmlyc3QuICBCZSBjYXNlIGluc2Vuc2l0aXZlLlxuXHQgKi9cblx0dmFyIGZpeGVkQ3NzID0gY3NzLnJlcGxhY2UoL3VybFxccypcXCgoKD86W14pKF18XFwoKD86W14pKF0rfFxcKFteKShdKlxcKSkqXFwpKSopXFwpL2dpLCBmdW5jdGlvbihmdWxsTWF0Y2gsIG9yaWdVcmwpIHtcblx0XHQvLyBzdHJpcCBxdW90ZXMgKGlmIHRoZXkgZXhpc3QpXG5cdFx0dmFyIHVucXVvdGVkT3JpZ1VybCA9IG9yaWdVcmxcblx0XHRcdC50cmltKClcblx0XHRcdC5yZXBsYWNlKC9eXCIoLiopXCIkLywgZnVuY3Rpb24obywgJDEpeyByZXR1cm4gJDE7IH0pXG5cdFx0XHQucmVwbGFjZSgvXicoLiopJyQvLCBmdW5jdGlvbihvLCAkMSl7IHJldHVybiAkMTsgfSk7XG5cblx0XHQvLyBhbHJlYWR5IGEgZnVsbCB1cmw/IG5vIGNoYW5nZVxuXHRcdGlmICgvXigjfGRhdGE6fGh0dHA6XFwvXFwvfGh0dHBzOlxcL1xcL3xmaWxlOlxcL1xcL1xcLykvaS50ZXN0KHVucXVvdGVkT3JpZ1VybCkpIHtcblx0XHQgIHJldHVybiBmdWxsTWF0Y2g7XG5cdFx0fVxuXG5cdFx0Ly8gY29udmVydCB0aGUgdXJsIHRvIGEgZnVsbCB1cmxcblx0XHR2YXIgbmV3VXJsO1xuXG5cdFx0aWYgKHVucXVvdGVkT3JpZ1VybC5pbmRleE9mKFwiLy9cIikgPT09IDApIHtcblx0XHQgIFx0Ly9UT0RPOiBzaG91bGQgd2UgYWRkIHByb3RvY29sP1xuXHRcdFx0bmV3VXJsID0gdW5xdW90ZWRPcmlnVXJsO1xuXHRcdH0gZWxzZSBpZiAodW5xdW90ZWRPcmlnVXJsLmluZGV4T2YoXCIvXCIpID09PSAwKSB7XG5cdFx0XHQvLyBwYXRoIHNob3VsZCBiZSByZWxhdGl2ZSB0byB0aGUgYmFzZSB1cmxcblx0XHRcdG5ld1VybCA9IGJhc2VVcmwgKyB1bnF1b3RlZE9yaWdVcmw7IC8vIGFscmVhZHkgc3RhcnRzIHdpdGggJy8nXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIHBhdGggc2hvdWxkIGJlIHJlbGF0aXZlIHRvIGN1cnJlbnQgZGlyZWN0b3J5XG5cdFx0XHRuZXdVcmwgPSBjdXJyZW50RGlyICsgdW5xdW90ZWRPcmlnVXJsLnJlcGxhY2UoL15cXC5cXC8vLCBcIlwiKTsgLy8gU3RyaXAgbGVhZGluZyAnLi8nXG5cdFx0fVxuXG5cdFx0Ly8gc2VuZCBiYWNrIHRoZSBmaXhlZCB1cmwoLi4uKVxuXHRcdHJldHVybiBcInVybChcIiArIEpTT04uc3RyaW5naWZ5KG5ld1VybCkgKyBcIilcIjtcblx0fSk7XG5cblx0Ly8gc2VuZCBiYWNrIHRoZSBmaXhlZCBjc3Ncblx0cmV0dXJuIGZpeGVkQ3NzO1xufTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9saWIvdXJscy5qc1xuLy8gbW9kdWxlIGlkID0gNVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9