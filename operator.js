#!/usr/local/bin/node
// # Operator.js connects your calls
// This program provides instructions to a node serer on how to respond to network requests
// The request method, url, and headers may be inspected to determine what data to send back
// if a GET request was made to a directory, find a figtree in that directory (or its parents) for instructions on how to build a new workspace
// if a GET request is made to a static file, stream that file from disk to client (pipe fs.createReadStream to response)
// if a POST request is made, (attempt to) execute the query and pipe the child process to the response. Permissions errors are returned to client.
// if a DELETE request is made, (attempt to) delete the file specified. Permissions errors are returned to client.
// if a PUT request is made, (attempt to) write request body to disk. Permissions error yada yada.
