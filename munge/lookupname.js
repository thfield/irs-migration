'use strict'
const lookup = require('./lookup')

let args = process.argv.slice(2)

let res = lookup.byName(...args)
console.log(res)
