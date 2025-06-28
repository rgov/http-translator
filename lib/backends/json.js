'use strict'

function generateJSON(request) {
  return JSON.stringify(request, null, 2)
}


export const name = 'JSON'
export const generate = generateJSON
export const highlighter = 'javascript'

export default {
  name,
  generate,
  highlighter,
}
