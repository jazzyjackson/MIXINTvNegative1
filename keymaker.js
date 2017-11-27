/* authorization is two step: magicurl -> valid session?; magiculr -> identity profile */
/* only the first call is necessary for every request, seshcache keeps a local copy of the identity profile to avoid making unneccessary API calls */
const seshcache = {} 
// read file sync, blocking, happens once at start up
const keyconfig = JSON.parse(require('fs').readFileSync("keyconfig.json").toString())[process.env.sso || 'localhost']

const agent = require('https')

// extract all the necessary values from the imported config
// if you don't have a keyconfig you can start switchboard or operator with a truthy environment variable "nokeyok" (no key ok)
const { callbackURL, SSOURL, SSOquery, checkAuthDomain, cookieDomain, identityKey} = keyconfig

const formatCookie = key => 'magicurl=' + key + ';Path=/;Domain=' + cookieDomain

async function identify(request, response){
    /* first check if there is a key in the cookie or in the url. If not, exit.  */
    var key = findKey(request.url) || findKey(request.headers.cookie)
    // if environment variable 'no key OK' is truthy, set ID as 'nobody', allowing users without authorization cookies to interact with the server.
    // else, request.id will be undefined and switchboard will redirect 
    if(!key) return request.id = process.env.nokeyok && 'nobody'

    /* wait for SSO to verify that a given key is still valid / logged in, if not, erase key from cookie and exit */
    var isAuthorized = await getSessionID(key)
    if(!isAuthorized) return response.setHeader('set-cookie', formatCookie(null)) //null will get stringified, but wont match /[0-9A-F]+/ so it's effectively null (regex returns null)
                                                                                  //since Path and Domain are set to be identical on all cookies, this will overwrite
    /* check seshcache, if I know who are you, great, make sure key is on cookie and exit */
    request.id = seshcache[key]
    if(request.id) return response.setHeader('set-cookie', formatCookie(key))

    /* if you've got a good key, but I didn't know who you are, get profile, and put you in the seshcache, set cookie, and exit */
    request.id = seshcache[key] = (await getProfile(key))[identityKey] // what is the 
    return response.setHeader('set-cookie', formatCookie(key))
}

/* private functions */

function findKey(queryString){
    // this regex should find the uppercase hexidecimal string given to a user as an authentication token
    var key = /magicurl=([0-9A-F]+)/.exec(queryString)
    // if key is null return null, else, the key was found, and is sitting at index 1 of the regex object
    return key && key[1]
}

/* promises checkAuth and getFullName request JSON data from SSO */
function getSessionID(magicurl){
    return new Promise((resolve,reject) => {
        var checkAuthRoute = '/am/amapi/user/session/'
        var authKeyName = 'isAuthorized' // expected to be type Boolean true
        request.get(checkAuthDomain + checkAuthRoute + magicurl, response => {
            var resBuffers = []
            response.on('data', data => resBuffers.push(data))
            response.on('end', () => {
                var result = JSON.parse(Buffer.concat(resBuffers).toString())
                resolve(result[authKeyName] == true)
            })
        }).on('error', error => {
            reject(error.code)
        })
    })
}

function getProfile(sessionID){
    return new Promise((resolve,reject) => {
        var checkIdentityRoute = '/am/amapi/user/profile_core/'
        request.get(checkAuthDomain + checkIdentityRoute + sessionID, response => {
            var resBuffers = []
            response.on('data', data => resBuffers.push(data))
            response.on('end', () => {
                resolve(JSON.parse(Buffer.concat(resBuffers).toString()))
            })
        }).on('error', reject)
    })
}


function trySSL(keycert){
    // mutates keycert object to contain key and cert. if object has key/cert properties already, those values are used as filenames and overwritten with file contents
    if(process.env.DISABLE_SSL){
        /* force HTTP server and skip reading files */
        return false
    }
    try {
        /* blocking, but only once at start up */
        keycert.key = fs.readFileSync(keycert.key || 'key')
        keycert.cert = fs.readFileSync(keycert.cert || 'cert')
        return true // only sets SSL_READY if reading both files succeeded
    } catch(SSL_ERROR){
        bookkeeper.log({SSL_ERROR: SSL_ERROR})
        return false
    }
}

module.exports = { trySSL, identify, authRedirect: SSOURL + SSOquery + callbackURL }