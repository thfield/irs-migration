import * as d3 from 'd3'
import 'd3-queue'
// import * as topojson from 'topojson'

// import statesTopoJson from './states.topo.json'
// import countiesTopoJson from './counties.topo.json'

let dataPath = '/api/allcounties'
let countyTopoPath = '/counties.topo.json'

d3.queue()
  .defer(d3.json, dataPath)
  // .defer(d3.json, countyTopoPath)
  .await(handler)

function handler (error, data, countiesTopoJson) {
  if (error) console.error(error)
  let foo = d3.nest()
    .key(d => d.state)
    .entries(data)

  let mainDiv = document.querySelector('#counties')
  let linksList = document.querySelector('#links-list')

  foo.forEach(function (state) {
    if (state.key === 'FR') { return }
    let stateEl = document.createElement('div')
    let stateTitle = createState(state.key, stateEl)
    let stateUl = document.createElement('ul')
    stateEl.appendChild(stateUl)
    state.values.forEach(function (co) {
      createCounty(co, stateUl)
    })
    mainDiv.appendChild(stateEl)

    let stateLink = document.createElement('a')
    stateLink.setAttribute('href', `#${state.key}`)
    stateLink.textContent = state.key

    let stateOption = document.createElement('li')

    stateOption.appendChild(stateLink)
    linksList.appendChild(stateOption)
  })

  // /* *** start map drawing *** */
  // let mapSvg = d3.select('#map svg')
  // let path = d3.geoPath()
  // let tooltip = d3.select('#tooltip')
  //
  // let zoom = d3.zoom()
  //   .scaleExtent([1, 8])
  //   .on('zoom', zoomed)
  // mapSvg
  //   .on('click', stopped, true)
  //   .call(zoom) // delete this line to disable free zooming
  // let mapEls = mapSvg.append('g')
  //
  // /* *** draw counties *** */
  // let countymapel = mapEls.append('g')
  //       .attr('class', 'counties')
  // countymapel.selectAll('path')
  //     .data(topojson.feature(countiesTopoJson, countiesTopoJson.objects.counties).features)
  //     .enter().append('path')
  //       .attr('d', path)
  //       .attr('stroke', '#000')
  //       .attr('fill', '#fff')
  //       .attr('class', 'county')
  //       .on('mouseover', ttOver)
  //       .on('mousemove', ttMove)
  //       .on('mouseout', ttOut)
  //       .on('click', clicked)
  //
  // /* *** draw states *** */
  // mapEls.append('path')
  //     .attr('stroke-width', 0.5)
  //     .attr('d', path(topojson.mesh(statesTopoJson, statesTopoJson.objects.states)))
  //
  // /* *** tooltip handler functions *** */
  //
  // /** @function ttOver
  //  * handler for map interaction on mouseover event, attached to county lineshapes
  //  */
  // function ttOver (d) {
  //   d3.select(this).classed('highlight', true)
  // }
  //
  // /** @function ttMove
  //  * handler for map interaction on mousemove event, attached to county lineshapes
  //  */
  // function ttMove (d) {
  //   tooltip
  //       .style('left', d3.event.pageX - 50 + 'px')
  //       .style('top', d3.event.pageY - 70 + 'px')
  //       .style('display', 'inline-block')
  //       .html(`<strong>${d.properties.name}, ${d.properties.state}</strong>`)
  // }
  //
  // /** @function ttOut
  //  * handler for map interaction on mouseout event, attached to county lineshapes
  //  */
  // function ttOut (d) {
  //   tooltip.style('display', 'none')
  //   d3.select(this).classed('highlight', false)
  // }
  //
  // /* *** zooming functions *** */
  //
  // /** @function clicked
  //  * handler function for clicking on county lineshape
  //  */
  // function clicked (d) {
  //   console.log(d.properties.geoid)
  // }
  //
  // /** @function zoomed
  // * handler function for mouse scrollwheel zooming
  // */
  // function zoomed () {
  //   mapEls.style('stroke-width', 1.5 / d3.event.transform.k + 'px')
  //   mapEls.attr('transform', d3.event.transform)
  // }
  //
  // /** @function stopped
  //  * stops zooming on mouse click
  //  */
  // function stopped () {
  //   if (d3.event.defaultPrevented) d3.event.stopPropagation()
  // }
}

function createState (state, parentEl) {
  let st = document.createElement('h3')
  st.textContent = state
  st.setAttribute('id', state)
  parentEl.appendChild(st)
  return st
}

function createCounty (county, parentEl) {
  let li = document.createElement('li')
  let a = document.createElement('a')
  a.setAttribute('href', `/explore/${county.fips}`)
  a.textContent = county.name
  li.appendChild(a)
  parentEl.appendChild(li)
}
