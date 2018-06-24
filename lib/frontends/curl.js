'use strict'

const shlex = require('shlex')
const argparse = require('argparse')

const http = require('../http-request')


// Patch argparse.ArgumentParser to log messages, rather than die
argparse.ArgumentParser.prototype._printMessage = function (message) {
  this.log(message.replace(/\s+$/, ''))
}

argparse.ArgumentParser.prototype.exit = function (status, message) {
  this.log(message.replace(/\s+$/, ''))
  this.log('The argument parser exited with status', status)
  this.exit_status = status
}


function parseCurlCommandLine(command, log=console.log) {
  var argv = shlex.split(command)
  argv.shift()  // consume the leading `curl`

  var parser = new argparse.ArgumentParser({ prog: 'curl' })
  parser.log = log  // allow _printMessage patch to use our logger
  parser.addArgument(['url'])
  parser.addArgument(['--request', '-X'], { dest: 'method', defaultValue: 'GET'})
  parser.addArgument(['--header', '-H'], { dest: 'headers', action: 'append'})
  parser.addArgument(['--referer', '-e'])
  parser.addArgument(['--user-agent', '-A'])
  parser.addArgument(['--data', '-d'])
  var [args, extra] = (parser.parseKnownArgs(argv) || [])
  
  // If the parser died, don't continue
  if (parser.exit_status !== undefined) { return }
  
  // We don't parse all arguments. Be transparent about it.
  if (extra.length > 0) {
    log('I skipped these unsupported arguments:', extra)
  }
  
  var req = new http.Request()
  req.uri = args.url
  req.method = args.method
  
  for (var header in args.headers) {
    var match
    if (match = header.match(/^\s*([^:]+);\s*$/)) {
      req.headers[match[0]] = ''
    } else if (match = header.match(/^\s*(\w+):\s*(.*?)\s*$/)) {
      req.headers[match[0]] = match[1]
    } else if (match = header.match(/^\s*([^:]+):\s*$/)) {
      // Tricky case, this syntax will unset a default header, but otherwise
      // won't unset a 
      var name = match[0]
      log('I don\'t support unsetting headers (like ' + name + ') yet.')
    } else {
      log('I don\'t understand this header:', header)
    }
  }
  
  return req
}


module.exports.name = 'curl'
module.exports.parse = parseCurlCommandLine
module.exports.highlighter = 'shell'
