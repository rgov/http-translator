'use strict'

class Request {
  constructor () {
    this.uri = null
    this.method = null
    this.headers = []
    this.cookies = []
    this.body = []
  }
}


exports.Request = Request
