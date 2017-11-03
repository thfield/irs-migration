'use strict'
const lookup = require('./utils/lookup')

let args = process.argv.slice(2)

let res = lookup.byFips(...args)
console.log(res)
