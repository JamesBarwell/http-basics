var http = require('http')
var fs = require('fs')
var debug = {
    request: require('debug')('req'),
    response: require('debug')('res')
}
var crypto = require('crypto')

var htmlTemplate = fs.readFileSync('./html/index.html', 'utf8')

var server = http.createServer(function(req, res) {

    logRequest(req)

    var urlParts = req.url.split('/')

    if (urlParts[1] == 'favicon.ico') {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end()
    }

    var reponseCode = 404
    var responseHtml = 'not found'

    if (urlParts[1] == 'nocache') {
        responseCode = 200
        responseHtml = getPageHtml('index', '/nocache')
        res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0');
    }

    if (urlParts[1] == 'cache') {
        responseCode = 200
        responseHtml = getPageHtml('index', '/cache')
        res.setHeader('Cache-Control', 'max-age=30');
    }

    if (urlParts[1] == 'etag') {
        responseHtml = getPageHtml('index', '/etag')
        var contentMd5 = getHash(responseHtml)
        var checkMd5 = req.headers['if-none-match']

        if (checkMd5 == contentMd5) {
            responseCode = 304
            responseHtml = null
        } else {
            responseCode = 200
        }

        res.setHeader('Etag', contentMd5);
    }

    debug.response(responseCode, res._headers)

    res.writeHead(responseCode, {'Content-Type': 'text/html'});
    res.end(responseHtml)
}).listen(80)

function logRequest(req) {
    var logHeaders = {}
    var fields = [
        'if-none-match'
    ]
    fields.forEach(function(header) {
        if (req.headers[header]) {
            logHeaders[header] = req.headers[header]
        }
    });

    debug.request(req.method, req.url, logHeaders)
}

function getPageHtml(name, path) {
    var html = replaceAll('{{ path }}', path, htmlTemplate)
    return html
}

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function getHash(string) {
    var hash = crypto.createHash('md5')
    hash.update(string)
    return hash.digest('hex')
}
