process.stdin.on('data', data => {
    let results = require('chrono-node').parse(data.toString())
                  .map(result => Object.assign({}, result.start.knownValues, result.start.impliedValues))
                  .map(result => new Date(result.year, result.month - 1, result.day, result.hour, result.minute, result.second, result.millisecond))
    switch(results.length){
        case 0: process.stdout.write(JSON.stringify({error: data.toString() + " didn't look like anything to me"})); break;
        case 1: process.stdout.write(JSON.stringify({from: results[0]})); break;
        case 2: process.stdout.write(JSON.stringify({from: results[0], to: results[1]})); break;
    }
    process.stdout.write('\n')
})