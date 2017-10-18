/** @function circle
 * @param {number[]} center - [cX, cY]
 * @param {number} radius
 * @returns {string}
 * @description Return a path string to draw a circle
 * centered at center, with radius radius
 */
function circle (center, radius) {
  return `M ${center[0]}, ${center[1]}
        m -${radius}, 0
        a ${radius},${radius} 0 1,0 ${radius * 2},0
        a ${radius},${radius} 0 1,0 -${radius * 2},0`
}

export {circle}
