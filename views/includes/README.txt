Thoughts:
We could treat the create-post.ejs in the same way as we have done with the file home-dashboard.ejs, but that line of thinking would result in a lot of duplication very quickly. What I mean is, just about every template in our App is going to need this uniform header.
Let's just create a one single-reusable template file that's just for the header and all of the other templates can pull in that file.(here, header.ejs)

So, we move the very first part into header.ejs from home-dashboard.ejs file.


course 71st:
...
Make home-dashboard.ejs and home-guest.ejs share the same header part...
...

<% %> dynamic mode of ejs works similar to the preprocessor in C and C++...

...
set a reusable file for our footer
...

get rid of duplicated code


