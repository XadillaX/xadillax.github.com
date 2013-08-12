---
layout      : post
title       : 关于JavaScript中callback函数的this指针重定义
category    : Programming
tags        : [ "Node.js", "JavaScript" ]
---
{% include JB/setup %}

最近在写**NBUT Virtual Judge**的内核框架，用的又是Node.JS了，把它当作一个本地运行的脚本不断进行轮询。

众所周知JS中的一个精髓就是**异步回调**。

所以在我自己写的框架中也经常会出现类似于下面的代码：

{% highlight js %}
foo.bar(a, b, function(){});
{% endhighlight %}

总而言之就是写一个函数，这个函数将会调用一个回调函数。

那么如果我们想在`function`中也用`this`来指代这个`foo`对象该怎么办呢？


结果还是IRC有用。本人跑Node.JS的IRC上问了这个问题，结果有人就这样回复我了：

> 13:07 < shama> xadillax: foo(a, b callback.bind(foo))
>
> 13:10 < olalonde> foo (a, b fn) { fn = fn.bind(this); …. }

然后还很热心地给了我个网址：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind

总之最后得出的结论就是说：

你只要给你的callback函数指定一个this指针即可。

如：

{% highlight js %}
var cb = callback.bind(foo);
foo.bar(a, b, cb);
{% endhighlight %}

这样就能在回调函数中使用`foo`来作为其`this`指针了。
