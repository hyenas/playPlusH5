/**
 * @name publicity
 * @author: zhangyang
 */

'use strict';

require.config({
    baseUrl: 'js/vendor/',
    paths: {
        'Zepto': 'zepto.min',
        'PP': 'PP',
        'slider': 'slider'
    },
    shim: {
        'Zepto': {
            exports: '$'
        },
        'PP': {
            deps: ['Zepto']
        },
        'slider': {
            deps: ['Zepto']
        }
    }
});

require(['Zepto','PP','slider'], function () {
    //setTimeout(window.scrollTo(0, 0), 1);
    var work = {};
    work.data = {};
    work.isSlideRender = false;

    work.init = function(){
        //define global variable
        // online this._URL = 'http://api.playplus.me/v1.0/shares/works/';
        this._URL = 'https://test.api.playplus.me/v1.0/shares/works/';
        this.textHeight = 0;
        this.mask = "<span class='loading'><span>";
        function onResize(){
            if($(window).width() < $(window).height()){
                $('.stream').show();
                $('.presentation').hide();
                work.textHeight = 0;
                work.callback(work.data);
            }
            else{
                $('.stream').hide();
                $('.presentation').show();
                if(!work.isSlideRender){
                    work.isSlideRender = true;
                    work.presentation(work.data.presentation.slides);
                }
            }
            
        }
        window.addEventListener("orientationchange" in window ? "orientationchange" : "resize", onResize, false);
    };

    work.action = function(){
        var me = this;
        //load data
        $.ajax({
            type: 'GET',
            dataType: 'json',
            headers:{
                'X-Request-ID': PP.getUUID()
            },
            url: me._URL + PP.getURLParam('workId'),
            jsonpCallback:'jsonp1',
            cache: true,
            success:function(data) {
                work.data = data;
                me.callback(data);
            },
            error:function(data) {
                // body...
            }
        });
    };


    work.callback = function(mockData){
        var me = this;
        //auto adaptation, calculate rem, if failed then default will be 50px
        PP.setREM(mockData.story.layout.cols);

        //update title
        if(mockData.title){
            window.document.title = mockData.title;
            var ua = window.navigator.userAgent.toLowerCase(); 
            if(ua.match(/MicroMessenger/i) == 'micromessenger'){ 
                // hack the issue can't change document.title in wechat webview 
                var $iframe = $('<iframe src="/favicon.ico"></iframe>').on('load', function() {
                    setTimeout(function() {
                        $iframe.off('load').remove()
                    }, 0)
                }).appendTo($('body'));
            }
        }

        $('header div.mask').show();
        $('.loadApp').show();
        me.renderCover(mockData);
        me.renderShots(mockData.story.shots);
    };

    work.presentation = function(data) {
        var i,
            l = data.length,
            slideArr = [],
            textBlock,
            slideLi;

        for(i=0; i<l; i++){
            if(data[i].content.type == 'image'){
                slideLi = "<li><img src=" + data[i].content.pictureUrl + "></li>";
            }
            else if(data[i].content.type == 'text'){
                slideLi = "<li><p class='" + data[i].content.charStyle + "' style=\"text-align:" + data[i].content.alignment + ";\">" + data[i].content.text + "</p></li>"
            }

            slideArr.push(slideLi);
        }

        setTimeout(function(){
            $(".presentation").mobileSlider({
                blocks:slideArr,
                height: $(window).height(),
                during: 3000,
                speed: 100
            })
        }(), 500)

        work.moveSlider = function(index){
            $('ul',$(".presentation")).css({
                left: '-' + index * $(window).width()
            })
        };
    };

    //lazy load
    work.getHeight = function(obj) {
        var h = 0;  
        while (obj) {  
            h += obj.offsetTop;  
            obj = obj.offsetParent;  
        }  
        return h;  
    };

    work.loadImages = function(){
        var me=this,
            images = $("#prdList img"),
            l=images.length;  
      
        for (var i = 0; i < l; i++) {  
            var img = images[i];
            //检查img是否在可视区域  
            var t = document.documentElement.clientHeight + (document.documentElement.scrollTop || document.body.scrollTop);  
            var h = me.getHeight(img);
            if (h < t && !img.getAttribute("src")) {
                img.setAttribute("src",img.getAttribute("data-src"));
            }  
        } 
    };

    work.caculateTextPosition = function (index) {
        var i,
            shotsDiv =  $('#shotsDiv div'),
            l=shotsDiv.length,
            shot,
            shotsArr = [],
            positionTop = 0;

        for(i=l-1; i>=0; i--){
            shot = shotsDiv[i];
            shotsArr.push(shot.offsetTop + $(shot).height());

        }

        positionTop = shotsArr[0];
        for(i=0; i<l; i++){
            if(shotsArr[i] > positionTop){
                positionTop = shotsArr[i];
            }
        }

        return positionTop;
    };

    work.centerCrop = function(evt){
        var img = $(evt.currentTarget),
            div = img.parent(),
            area,
            offset,
            area = {},
            divWidth = div.width(),
            divHeight = div.height(),
            imgWidth = img.width(),
            imgHeight = img.height();

        if(divWidth/divHeight>imgWidth/imgHeight){
            offset = Math.round(((imgHeight - imgWidth/divWidth * divHeight)/ 2) / imgHeight * 100);
            area.startLoc = {
                "xPct": 0,
                "yPct": offset
            }
            area.endLoc = {
                "xPct": 100,
                "yPct": 100 - offset
            }
        }
        else{
            offset = Math.round(((imgWidth - imgHeight/divHeight * divWidth)/ 2) / imgWidth * 100);
            area.startLoc = {
                "xPct": offset,
                "yPct": 0
            }
            area.endLoc = {
                "xPct": 100 - offset,
                "yPct": 100
            }
        }

        img.data('area',area);

        var scaleX =  1 / (area.endLoc.xPct - area.startLoc.xPct),
            scaleY =  1 / (area.endLoc.yPct - area.startLoc.yPct);

        var top = area.startLoc.yPct * divHeight * scaleY,
            right = area.endLoc.xPct * divWidth * scaleX,
            bottom = area.endLoc.yPct * divHeight * scaleY,
            left = area.startLoc.xPct * divWidth * scaleX; 

        img.css({
            visibility: 'visible',
            top: -top + 'px',
            left: -left +'px',
            width: scaleX * 10000 + '%',
            height: scaleY  * 10000+ '%',
            clip: 'rect('+ top + 'px,' + right + 'px,' + bottom + 'px,' + left + 'px)'
        })

        $('span.loading',div).hide();
    };

    work.clipImage = function (img,area) {
        var div = img.parent(),
            divWidth = div.width(),
            divHeight = div.height();

        var scaleX =  1 / (area.endLoc.xPct - area.startLoc.xPct),
            scaleY =  1 / (area.endLoc.yPct - area.startLoc.yPct);

        var top = area.startLoc.yPct * divHeight * scaleY,
            right = area.endLoc.xPct * divWidth * scaleX,
            bottom = area.endLoc.yPct * divHeight * scaleY,
            left = area.startLoc.xPct * divWidth * scaleX; 

        img.css({
            top: -top + 'px',
            left: -left +'px',
            width: scaleX * 10000 + '%',
            height: scaleY  * 10000+ '%',
            clip: 'rect('+ top + 'px,' + right + 'px,' + bottom + 'px,' + left + 'px)'
        })
        //$('span.loading').hide();
        img.show();
    };

    work.hideLoading = function(evt){
        var img = $(evt.currentTarget),
            div = img.parent();
        img.css({
            visibility:'visible'
        });
        $('.loading',div).hide();
    }

    //render the header
    work.renderCover = function(mockData){
        var me=this,
            banner = $('header .banner'),
            text = $('header div.title'),
            coverImg = $('<img>',{src: mockData.story.cover.pictureUrl}),
            title = $('<p>',{class:'title'}).text(mockData.title),
            subtitle = $('<p>',{class:'subtitle'}).text(mockData.subtitle),
            cover=mockData.story.cover;

        $("header div").empty();

        banner.append(coverImg);
        banner.append($(me.mask));
        text.append(title).append(subtitle);

        if(cover.picArea && cover.picArea.startLoc && cover.picArea.startLoc.xPct != -1){
            coverImg.on('load',me.hideLoading);
            me.clipImage(coverImg,cover.picArea);
        }
        else{
            coverImg.on('load',me.centerCrop);
        }
    };

    //render shots
    work.renderShots = function(shots){
        var i,
            shot,
            shotType,
            length = shots.length,
            shotsDiv = $('#shotsDiv'),
            shotBlock,
            shotImg,
            shotText,
            rem = parseInt(document.documentElement.style.fontSize),
            me = this;

        $("#shotsDiv").empty();

        for(i=0; i<length; i++){
            shot = shots[i];
            shotType = shot.content.type;

            if(shotType == 'image'){
                shotImg = $('<img>',{src:shot.content.pictureUrl});
                shotBlock = $('<div>',{class:'img-shot'});
                 
                shotBlock.css({
                    width: (shot.size.colSpan - 10/rem) + 'rem',
                    height: (shot.size.rowSpan - 10/rem) + 'rem',
                    top: (shot.position.rowIndex+me.textHeight) + 'rem',
                    left: shot.position.colIndex + 'rem'
                })

                shotBlock.append(shotImg);
                shotBlock.append($(me.mask));
                shotsDiv.append(shotBlock);

                if(shot.picAreaInShot && shot.picAreaInShot.startLoc && shot.picAreaInShot.startLoc.xPct != -1){
                    //shotImg.data('area',shot.picAreaInShot);
                    shotImg.on('load',me.hideLoading);
                    me.clipImage(shotImg,shot.picAreaInShot);
                }
                else{
                    //shotImg.data('area',shot.size);
                    shotImg.on('load',me.centerCrop);
                }
            }
            else if(shotType == 'text'){
                shotText = $('<p>',{class:shot.content.charStyle}).text(shot.content.text);
                shotBlock = $('<div>',{class:'text-shot'});
                shotBlock.css({
                    "text-align": shot.content.alignment,
                    top: me.caculateTextPosition()

                })
                
                shotBlock.append(shotText);
                shotsDiv.append(shotBlock);
                me.textHeight = me.textHeight + shotBlock.height()/rem - shot.size.rowSpan;
            }
        }

        var offsetDiv = $("<div class='offset'><div>")
        offsetDiv.css({
            width: '100%',
            height: '.8rem',
            top: me.caculateTextPosition(),
            left:0,
            margin:'5px 0 0 0'
        })
        shotsDiv.append(offsetDiv);
    };

    $(function(){
        work.init();
        work.action();
    });


    // window.onscroll = function () {
    //     loadImages();
    // };
    
})
