jQuery.fn.extend({
    follow : function() {
        var args = arguments[0] || {};
        var follow = args.follow;
        var speed = args.speed;
        if (speed == undefined) { speed = 1000; }
        if (follow == undefined) { follow = true; }
        if (follow) {
            $(this).stop(true).animate({"marginTop": $(window).scrollTop() + "px"}, speed);
        }
    },

    overlay : function() {
        var args = arguments[0] || {};
        var speed = args.speed;
        if (speed == undefined) { speed = 400; }
        $(this).hover(function() {
            $(this).children(".overlay").stop(true,true).hide().fadeIn(speed);
        }, function() {
            $(this).children(".overlay").stop(true,true).fadeOut(speed);
        });
    }
});

$(function(){
    $(window).scroll(function() {
        $("#sidebar").follow({ });

        if($(this).scrollTop() > 100) {
            $("#back-to-top").stop(true, true).fadeIn();
        } else {
            $("#back-to-top").stop(true, true).fadeOut();
        }
    });

    $("#back-to-top").click(function() {
        $("body,html").stop(true).animate({scrollTop: 0},1000);
    });
});