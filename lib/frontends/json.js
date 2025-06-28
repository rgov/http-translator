'use strict'

import { Request } from '../http-request'

function parseJSON(input) {
  return Object.assign(new Request(), JSON.parse(input))
}

export const name = 'JSON'
export const parse = parseJSON
export const highlighter = { name: 'javascript', json: true }

export default {
  name,
  parse,
  highlighter,
}
