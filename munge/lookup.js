'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')
const munge = require('../src/munge.js')

let targetCounty = process.argv[2].toLowerCase() || undefined
let targetState = process.argv[3].toLowerCase() || undefined


if (targetCounty === undefined || targetState === undefined) {
  console.log('you must specify a county and state\n')
  console.log('in the format: County ST')
  process.exit(1)
}

const path = '../data'
const fipsCounty = '06075'

let fipsPath = `${path}/fipscodes.csv`
const fips = d3.csvParse(fs.readFileSync(fipsPath, 'utf8'), function (r) {
  r.state = r.state.toLowerCase()
  r.name = r.name.toLowerCase()
  return r
})

let dataPath = `${path}/${fipsCounty}/${fipsCounty}combined.csv`
const data = d3.csvParse(fs.readFileSync(dataPath, 'utf8'), function (r) {
  let meanAgi = +r.agi / +r.n1
  return Object.assign(r, {meanAgi: meanAgi})
})

let res = fips.find(function (d) {
  return d.state === targetState && d.name.startsWith(targetCounty)
})

let dataIn = data.filter(function (d) {
  let cond1 = d.id === `${res.statefp}${res.countyfp}`
  let cond3 = d.y1_countyfips === res.countyfp
  return (cond1 && cond3)
})

let dataOut = data.filter(function (d) {
  let cond1 = d.id === `${res.statefp}${res.countyfp}`
  let cond3 = d.y2_countyfips === res.countyfp
  return (cond1 && cond3)
})

console.log(`You searched for ${targetCounty}, ${targetState}\n`)
console.log(`Found ${res.name}, ${res.state}\n`)
console.log(`FIPS Code: ${res.statefp}${res.countyfp}\n`)

console.log('In')
console.log(dataIn.map(formatResponse))
console.log('Out')
console.log(dataOut.map(formatResponse))

function formatResponse (d) {
  return `year: ${d.year}, n1: ${d.n1}, n2: ${d.n2}, agi: ${d.agi}, meanAgi: ${d.meanAgi}`
}
