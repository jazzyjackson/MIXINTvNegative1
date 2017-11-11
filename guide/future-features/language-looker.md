In experimenting with word bags vs concept bags and designing intent recognition/scoring,
I imagine an interface that lets me run an input through multiple strategies
Kind of an input->multiplex kind of thing, 
hsplit{
    thread{shellout,shellout,shellout},
    thread{shellout,shellout,shellout,
}
So I can set up a python script that does some word nety stuff and extracts keywords
And a different shells script that runs through chatscript and tells me what it thinks

And just be able to quickly test both on different inputs