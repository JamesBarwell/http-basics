var http = require('http')
var fs = require('fs')
var debug = {
    request: require('debug')('req'),
    response: require('debug')('res')
}
var url = require('url')

var template = {
    xss: fs.readFileSync('./html/xss.html', 'utf8')
}

var server = http.createServer(onRequest).listen(80)
function onRequest(req, res) {
    logRequest(req)
    var urlParts = req.url.split('/')

    if (handlers[urlParts[1]]) {
        handlers[urlParts[1]](req, res, urlParts)
        return
    }

    res.setHeader('Location', '/xss')
    respond(res, 302, null)
}

var handlers = {
    'favicon.ico': function(req, res) {
        respond(res, 404, null)
    },
    xss: function(req, res) {
        var parsedUrl = url.parse(req.url)
        var query = parsedUrl.query || ''
        var parts = query.split('=')
        var name = parts[1] || null

        var message = ''
        if (name) {
            message = 'Hello, ' + unescape(name)
        }
        var html = replaceTokens(template.xss, { message: message })

        respond(res, 200, html)
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
