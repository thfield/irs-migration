'use strict'
const d3 = require('d3-request')
Object.assign(d3, require('d3-collection'))

d3.json('/api/allcounties', function (error, data) {
  if (error) console.error(error)
  let foo = d3.nest()
    .key(d => d.state)
    .entries(data)

  let mainDiv = document.querySelector('#counties')
  let linksList = document.querySelector('#links-list')

  foo.forEach(function (state) {
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
})

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