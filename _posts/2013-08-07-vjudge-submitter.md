---
layout: post
category : project
tagline: "Supporting tagline"
tags : [intro, beginner, jekyll, tutorial]
---
{% include JB/setup %}

### WELCOME TO USE VJUDGE SUBMITTER

#### WHAT'S THIS

***Virtual Judge*** is something like the Polymerization of ***Online Judge***.


The ***Virtual Judge*** will contain several ***Online Judge***'s problems and when you submit code to one problem, the backend of ***Virtual Judge*** will submit your code to the origin ***Online Judge*** and fetch the submission record status and return.

This project is mainly for the people who is going to develop him/her self ***Virtual Judge***.

It gives you the unified API functions of each different ***Online Judges***.

The APIs including login, submit, and fetch result. If you have some better ideas, maybe it will contain an API based on your idea!

You contribute to `vjudge-submitter` and of cause `vjudge-submitter` will help you to easy build a Virtual Judge core!

#### PREPARATION

It's easy to use ***VJudge Submitter*** in your own ***Virtual Judge*** project.

First of all, come to your project directory and create a new directory if it not exists yet:

{% highlight sh %}
$ mkdir node_modules
{% endhighlight %} 

And then you can clone the ***VJudge Submitter*** to that directory or uncompress it via the package you downloaded:

{% highlight sh %}
$ git clone https://github.com/XadillaX/vjudge-submitter.git
{% endhighlight %} 

or

{% highlight sh %}
$ tar zxf filename.tar.gz
{% endhighlight %} 

Congratulations! Now you can use it in your own project!

### HOW TO USE IT

#### CREATE

You need get a submitter that ***VJudge Submitter*** supported. (You can view it in the [supported list](#supported-list))

{% highlight js %}
var vjs = require("vjudge-submitter");
var foo = vjs.getSubmitter("online judge name");
{% endhighlight %} 

You can change the logger level:

{% highlight js %}
vjs.setDefaultLogLevel("TRACE|DEBUG|INFO|WARNING|ERROR|FATAL");
{% endhighlight %} 

> **IMPORTANT**: It just influence the submitter after calling this function.

#### LOGIN

The `login` function is very simple:

{% highlight js %}
foo.login(username, password, callback);
{% endhighlight %} 

The only thing you shold care is the `callback`, it should be written like that:

{% highlight js %}
function callback(status, msg, baseheader) {
    //blahblah...
}
{% endhighlight %} 

The parameter are:

  + **status**: returns `true` when successfully and `false` when failed.
  + **msg**: it will be an empty string when successfully and it will be the **error message** when failed.
  + **baseheader**: this parameter will be used in `submit` or `result` function. Most importantly, this parameter includes the cookie information.

#### SUBMIT

Refer to the code below:

{% highlight js %}
foo.submit(problemID, language, code, baseheader, callback);
{% endhighlight %} 

> **Hint**: The `baseheader` here is the `baseheader` passed from the callback function of `login` function.

And the callback function of `submit` should be like:

{% highlight js %}
function callback(status, msg, baseheader) {
    //blahblah...
}
{% endhighlight %} 

It's similar to the callback function of `login` callback function's.

#### RESULT

This function is to fetch the running record of ***last*** submission. (Because we assume one **Virtual Judge Account** just doing one thing at one moment)

{% highlight js %}
foo.result(username, baseheader, callback);
{% endhighlight %} 

Because we would like to fetch the `COMPILATION_ERROR` if the record is that, we must logged in. As a result, we should pass the cookie information into the function - that is the `baseheader`.

And the callback function should be written like:

{% highlight js %}
function callback(status, msg, result) {
    //blahblah...
}
{% endhighlight %} 

> **NOTE**: This callback maybe called several times.
>
> + When the result is something like `COMPILING`, `RUNNING`, `QUEUING`, etc, the callback function will pass `false`, msg and the result is a `result object`.
> + When the fetching is wrong like `CONNECTION ERROR`, etc, the callback function will pass `false`, msg and the result is `null`. (It often happened when the submitter tries too many times but can't get the right information)
> + When the fetching is right, the callback function will pass `true`, msg and the result is a `result object`.

The so-called `result object` is something like:

{% highlight js %}
result = {
    runid    : "The running id",
    time     : "The running time",
    memo     : "The running memory",
    result   : "The result in that oj",
    finalresult : "The result after formatting"
};
{% endhighlight %} 

#### A SIMPLEST EXAMPLE

You can refer to the simplest example:

{% highlight js %}
var vjs = require("vjudge-submitter");
vjs.setDefaultLogLevel("INFO");
var username = "username";
var password = "password";
var code = "blahblah...";

var nbut = vjs.getSubmitter("nbut");
nbut.login(username, password, function(status, msg, baseheader) {
    // Something goes wrong.
    if(!status) {
        this.logger.error(msg);
        return;
    }

    this.submit("1000", "C++", code, function(status, msg, baseheader) {
        // Something goes wrong
        if(!status) {
            this.logger.error(msg);
            return;
        }

        this.result(username, "1000", function(status, msg, result) {
            // Something goes wrong
            if(!status && null === result) {
                this.logger.error(msg);
                return;
            }

            // PENDING
            if(!status) {
                var text = "The code status is still [ " + result["finalresult"] + " ]. Please wait.";
                this.logger.info(text);
                return;
            }

            var text = "The code status is finished in " + result["time"] + "ms and " + result["memo"] + "K with [ " + result["finalresult"] + " ]";
            this.logger.info(text);

            // The status is COMPILATION ERROR
            if(undefined !== result["ceinfo"]) {
                text = "And the CE information is:\n";
                text += result["ceinfo"];
                this.logger.info(text);
            }
        });
    });
});
{% endhighlight %} 

### CONTACT

Have a question?

+ Email: [admin#xcoder.in](mailto:admin#xcoder.in)
+ Issue: [On GitHub](https://github.com/XadillaX/vjudge-submitter/issues)

### CONTRIBUTE TO THIS PROJECT

Anyone and everyone is welcome to contribute. If you want to develop some Online Judge Support, you can do as the following link: [How to contribute a new OJ Submitter?](https://github.com/XadillaX/vjudge-submitter/wiki/How-to-contribute-a-new-OJ-Submitter%3F)

### AUTHORS

+ [@XadillaX](https://github.com/XadillaX)

Thanks for assistance and contributions:

> EMPTY YET

### LICENSE

I DON'T KNOW YET. WHO CAN HELP ME?

### APPENDIX

#### ONLINE JUDGE SUPPORT LIST

+ ***aizu***: [AIZU Online Judge](http://judge.u-aizu.ac.jp/onlinejudge/)
+ ***lsu***: [LSU Online Judge](http://acms.lsu.edu.cn:81/OnlineJudge/)
+ ***nbut***: [NBUT Online Judge](http://acm.nbut.edu.cn/)
+ ***nyist***: [NYIST Online Judge](http://acm.nyist.net/JudgeOnline/)
+ ***sysu***: [SYSU Online Judge](http://soj.me/)
+ ***zjut***: [ZJUT Online Judge](http://cpp.zjut.edu.cn/)
