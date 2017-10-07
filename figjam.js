// requries node 8+ in order to await the streaming of files in order
// like webpack without the pack
// still gzipped on the fly

//parseInt(undefined) is NaN and Boolean(NaN) is false
//so USES_BONES can be unset, or it can be set to 0, or anything that's not a real number, to not use bones.html 
//anyway if you want to force using bones.html just run "USES_BONES=1 node operator"
module.exports = respondFromFigTree
var fs = require('fs')

function respondFromFigTree(request, response){
  if(parseInt(process.env.USES_BONES) || process.versions.node < 8 || true){
    response.setHeader('content-type', 'text/html; charset=utf-8;')
    return fs.createReadStream('simplefig.html')
             .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
             .pipe(response)
  }
}