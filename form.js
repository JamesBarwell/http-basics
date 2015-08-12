var http = require('http')
var fs = require('fs')
var debug = {
    request: require('debug')('req'),
    response: require('debug')('res'),
    data: require('debug')('postdata')
}

var template = {
    index: 'test',
    form: fs.readFileSync('./html/form.html', 'utf8'),
    formThanks: fs.readFileSync('./html/form-thanks.html', 'utf8')
}

var server = http.createServer(onRequest).listen(80)
function onRequest(req, res) {
    logRequest(req)
    var urlParts = req.url.split('/')

    if (handlers[urlParts[1]]) {
        handlers[urlParts[1]](req, res, urlParts)
        return
    }

    respond(res, 404, 'not found')
}

var handlers = {
    'favicon.ico': function(req, res) {
        respond(res, 404, null)
    },

    basic: function(req, res) {
        if (req.method == 'GET') {
            var html = replaceTokens(template.form, { path: 'basic' })
            respond(res, 200, html)
            return
        }

        // post
        getReqData(req, function(data) {
            debug.data(data)
            var html = template.formThanks
            respond(res, 200, html)
        })
    },
    prg: function(req, res, urlParts) {
        if (req.method == 'GET') {
            if (!urlParts[2]) {
                // main page
                var html = replaceTokens(template.form, { path: 'prg' })
                respond(res, 200, html)
                return
            } else if (urlParts[2] == 'thanks') {
                // thanks page
                var html = template.formThanks
                respond(res, 200, html)
                return
            }
        }

        // post
        getReqData(req, function(data) {
            debug.data(data)
            res.setHeader('Location', '/prg/thanks')
            respond(res, 302, null)
        })
    },
    csrf: function(req, res) {
        respond(res, 404, null)
    }
}

function respond(res, code, html) {
    debug.response(code, res._headers)
    res.writeHead(code, {'Content-Type': 'text/html'});
    res.end(html)
}

function getReqData(req, callback) {
    var buffer = ''
    req.setEncoding('utf8')
    req.on('data', function(data) {
        buffer += data
    })
    req.on('end', function() {
        callback(buffer)
    });
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

function getCsrf() {
    return Math.floor(Math.random() * 1000000000)
}
