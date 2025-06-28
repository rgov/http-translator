'use strict'

function python_escape(value, quote='\'') {
  return value.replace(new RegExp('([' + quote + '\\\\])', 'g'), '\\$1')
              .replace(/\n/g, '\\n')
              .replace(/\t/g, '\\t')
              .replace(/\r/g, '\\r')
              .replace(/[^ -~]+/g, function (match) {
                var hex = Buffer.from(match).toString('hex')
                return hex.replace(/(..)/g, '\\x$1')
              })
}

function pythonize(obj) {
  if (typeof obj === 'string') {
    return '\'' + python_escape(obj) + '\''
  } else if (typeof obj === 'number') {
    return obj
  } else if (typeof obj === 'boolean') {
    return obj ? 'True' : 'False'
  } else if (obj === null || obj === undefined) {
    return 'None'
  } else if (Array.isArray(obj)) {
    return '[ ' + obj.map(pythonize).join(', ') + ' ]'
  } else if (obj.constructor === Object) {
    var rows = []
    for (let k in obj) {
      rows.push(pythonize(k) + ': ' + pythonize(obj[k]))
    }
    return '{ ' + rows.join(', ') + ' }'
  } else {
    throw 'unknown type'
  }
}

function generatePythonUrllib(request, logger=console) {
  // Determine required imports
  const imports = new Set()
  imports.add('urllib.request')
  
  // Emit preamble
  const code = []
  code.push('req = urllib.request.Request(')

  // Emit the URL
  const parsedURI = new URL(request.uri)
  const emitQueryParams = parsedURI.search !== ''
  if (emitQueryParams) {
    imports.add('urllib.parse')
    code.push(`  ${pythonize(parsedURI.origin + parsedURI.pathname + '?')} + urllib.parse.urlencode({`)
    for (const [name, value] of parsedURI.searchParams) {
      code.push(`    ${pythonize(name)}: ${pythonize(value)},`)
    }
    code.push('  }),')
  } else {
    code.push(`  ${pythonize(request.uri)},`)
  }

  // Emit the headers
  if (Object.keys(request.headers).length > 0) {
    code.push('  headers={')
    for (const name in request.headers) {
      code.push(`    ${pythonize(name)}: ${pythonize(request.headers[name])},`)
    }
    code.push('  },')
  }
  
  // Emit the body
  const hasFormData = request.formData && Object.keys(request.formData).length > 0
  if (request.jsonData !== undefined) {
    imports.add('json')
    code.push(`  data=json.dumps(${pythonize(request.jsonData)}).encode(),`)
  } else if (hasFormData) {
    imports.add('urllib.parse')
    code.push('  data=urllib.parse.urlencode({')
    for (const name in request.formData) {
      code.push(`    ${pythonize(name)}: ${pythonize(request.formData[name])},`)
    }
    code.push(`  }).encode(),`)
  } else if (typeof request.body === 'string' && request.body !== '') {
    code.push(`  data=b${pythonize(request.body)},`)
  }

  // Emit the method
  code.push(`  method=${pythonize(request.method)}`)

  // Finalize the code
  code.push(')')
  code.push('')
  code.push('with urllib.request.urlopen(req) as response:')
  code.push('    body = response.read().decode()')

  // Insert the needed imports at the top
  code.splice(0, 0, '')  // blank line before imports
  new Array(...imports)
    .sort((a, b) => b.localeCompare(a))  // reverse order
    .forEach(x => code.splice(0, 0, `import ${x}`));


  return code.join('\n')
}

export const name = 'Python urllib'
export const generate = generatePythonUrllib
export const highlighter = 'python'

export default {
  name,
  generate,
  highlighter
}
