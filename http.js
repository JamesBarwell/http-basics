var http = require('http')
var fs = require('fs')
var debug = {
    request: require('debug')('req'),
    response: require('debug')('res')
}
var crypto = require('crypto')

var template = {
    index: fs.readFileSync('./html/index.html', 'utf8')
}

var server = http.createServer(onRequest).listen(80)
function onRequest(req, res) {
    logRequest(req)
    var urlParts = req.url.split('/')

    if (handlers[urlParts[1]]) {
        handlers[urlParts[1]](req, res, urlParts)
        return
    }

    res.setHeader('Location', '/nocache')
    respond(res, 302, null)
}

var handlers = {
    'favicon.ico': function(req, res) {
        respond(res, 404, null)
    },
    nocache: function(req, res) {
        res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0');
        var html = replaceTokens(template.index, { path: '/nocache' })
        respond(res, 200, html)
    },
    cache: function(req, res) {
        var html = replaceTokens(template.index, { path: '/cache' })
        res.setHeader('Cache-Control', 'max-age=30');
        respond(res, 200, html)
    },
    etag: function(req, res) {
        var html = replaceTokens(template.index, { path: '/etag' })
        var contentMd5 = getHash(html)
        var checkMd5 = req.headers['if-none-match']

        if (checkMd5 == contentMd5) {
            respond(res, 304, null)
        } else {
            res.setHeader('Etag', contentMd5);
            respond(res, 200, html)
        }
    }
}

function respond(res, code, html) {
    debug.response(code, res._headers)
    res.writeHead(code, {'Content-Type': 'text/html'});
    res.end(html)
}

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

function replaceTokens(string, map) {
    Object.keys(map).forEach(function(token) {
        var value = map[token]
        string = replaceAll('{{ ' + token + ' }}', value, string)
    });
    return string
}

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function getHash(string) {
    var hash = crypto.createHash('md5')
    hash.update(string)
    return hash.digest('hex')
}
