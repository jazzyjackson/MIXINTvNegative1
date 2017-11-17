No dependencies?

NPM is pretty cool in that it gives you that pythonic sort of feeling of "import database connector" "import cookie parser" and so on, but back in early 2016 the perils of trusting a centralized repository became obvious as one developer took their code down, including a tiny module that left-pads strings, and broke some of the largest projects on the internet for a couple hours. I'm not a fan of NPM's accusatory 'it was someone else's fault' either:

"In this case, though, without warning to developers of dependent projects, Azer unpublished his kik package and 272 other packages. One of those was left-pad. This impacted many thousands of projects. Shortly after 2:30 PM (Pacific Time) on Tuesday, March 22, we began observing hundreds of failures per minute, as dependent projects — and their dependents, and their dependents… — all failed when requesting the now-unpublished package."

Like it was Azer's responsibility to let Facebook and everyone else know that their left-pad module was going offline.

The github issues' threads are pretty harrowing. What can you do when you're publishing your project but Babel is broken?
https://github.com/stevemao/left-pad/issues/4

