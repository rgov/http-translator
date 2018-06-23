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
  
  return req
}


exports.name = 'curl'
exports.parse = parseCurlCommandLine
exports.highlighter = 'bash'
