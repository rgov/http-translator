'use strict'

class Request {
  constructor () {
    this.uri = null
    this.method = null
    this.headers = {}
    this.cookies = []
    this.body = []
  }
  
  hasHeader(header) {
    return (header in this.headers)
  }
}


module.exports.Request = Request
