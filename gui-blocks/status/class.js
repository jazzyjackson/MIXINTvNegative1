let _console = console
console = {
    log: function(){
        alert(arguments.length)
        _console.log(...Array.from(arguments))
    }
}