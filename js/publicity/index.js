/**
 * @name publicity
 * @author: zhangyang
 */

'use strict';

require.config({
    baseUrl: 'js/vendor/',
    paths: {
        'Zepto': 'zepto.min'
    },
    shim: {
        'Zepto': {
            exports: '$'
        }
    }
});

require(['Zepto'], function () {
    var isDebug = false,
        URL = 'http://120.55.148.102/v1.0/shares/works/55f519b47353b4000a1f30f4';

    //define global variable
    var textHeight = 0;

    //lazy load
    var getHeight = function(obj) {
        var h = 0;  
        while (obj) {  
            h += obj.offsetTop;  
            obj = obj.offsetParent;  
        }  
        return h;  
    }

    var caculateTextPosition = function (index) {
        var i,
            shotsDiv =  $('#shotsDiv div'),
            l=shotsDiv.length,
            shot,
            shotsArr = [],
            positionTop = 0;

        for(i=l-1; i>l-4 && i>=0; i--){
            shot = shotsDiv[i];
            shotsArr.push(shot.offsetTop + $(shot).height());

        }

        positionTop = shotsArr[0];
        for(i=0; i<2; i++){
            if(shotsArr[i] < shotsArr[i+1]){
                positionTop = shotsArr[i+1];
            }
        }

        return positionTop;
    }

    var loadImages = function(){
        var images = $("#prdList img"),
            l=images.length;  
      
        for (var i = 0; i < l; i++) {  
            var img = images[i];
            //检查img是否在可视区域  
            var t = document.documentElement.clientHeight + (document.documentElement.scrollTop || document.body.scrollTop);  
            var h = getHeight(img);
            if (h < t && !img.getAttribute("src")) {
                img.setAttribute("src",img.getAttribute("data-src"));
            }  
        } 
    }

    var clipCover = function (evt) {
        var img = $(evt.currentTarget),
            div = img.parent(),
            area,
            offset,
            area = {},
            divWidth = div.width(),
            divHeight = div.height(),
            imgWidth = img.width(),
            imgHeight = img.height();   

        if(imgWidth>imgHeight){
            offset = Math.round(((imgWidth - imgHeight)/ 2) / imgWidth * 100);
            area.startLoc = {
                "xPct": offset,
                "yPct": 0
            }
            area.endLoc = {
                "xPct": 100 - offset,
                "yPct": 100
            }
        }
        else{
            offset = Math.round(((imgHeight - imgWidth)/ 2) / imgHeight * 100);
            area.startLoc = {
                "xPct": 0,
                "yPct": offset
            }
            area.endLoc = {
                "xPct": 100,
                "yPct": 100 - offset
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
            top: -top + 'px',
            left: -left +'px',
            width: scaleX * 10000 + '%',
            height: scaleY  * 10000+ '%',
            clip: 'rect('+ top + 'px,' + right + 'px,' + bottom + 'px,' + left + 'px)'
        }) 
    }

    var clipImage = function (img) {
        var img = img,
            div = img.parent(),
            area = img.data('area'),
            imgWidth = img.width(),
            imgHeight = img.height();

        var scaleX =  div.width() / ((area.endLoc.xPct - area.startLoc.xPct) * imgWidth),
            scaleY =  div.height() / ((area.endLoc.yPct - area.startLoc.yPct) * imgHeight);

        var top = area.startLoc.yPct * imgHeight * scaleY,
            right = area.endLoc.xPct * imgWidth * scaleX,
            bottom = area.endLoc.yPct * imgHeight * scaleY,
            left = area.startLoc.xPct * imgWidth * scaleX; 

        img.css({
            top: -top + 'px',
            left: -left +'px',
            width: scaleX * 10000 + '%',
            height: scaleY  * 10000+ '%',
            clip: 'rect('+ top + 'px,' + right + 'px,' + bottom + 'px,' + left + 'px)'
        })  
    }

    window.onscroll = function () {
        loadImages();
    };

    //load data
    $.ajax({
        type: 'GET',
        dataType: 'json',
        headers:{
            'X-Request-ID': 'UUID-002'
        },
        url: URL,
        jsonpCallback:'jsonp1',
        cache: true,
        success:function(data) {
            if(!isDebug){
                callback(data);
            }
        },
        error:function(data) {
            // body...
        }
    });

    //render the header
    var renderCover = function(mockData){
        var banner = $('header .banner'),
            text = $('header div.title'),
            img = $('<img>',{src: mockData.pictureStory.cover.pictureUrl}),
            title = $('<p>',{class:'title'}).text(mockData.title),
            subtitle = $('<p>',{class:'subtitle'}).text(mockData.subtitle);

        banner.append(img);
        text.append(title).append(subtitle);

        img.on('load',clipCover)
    }

    //render shots
    var renderShots = function(shots){
        var i,
            shot,
            shotType,
            length = shots.length,
            shotsDiv = $('#shotsDiv'),
            shotBlock,
            shotImg,
            shotText,
            rem = parseInt(document.documentElement.style.fontSize);

        for(i=0; i<length; i++){
            shot = shots[i];
            shotType = shot.content.type;

            if(shotType == 'image'){
                shotImg = $('<img>',{src:shot.content.pictureUrl});
                shotBlock = $('<div>',{class:'img-shot'});
                 
                shotBlock.css({
                    width: (shot.size.colSpan - 10/rem) + 'rem',
                    height: (shot.size.rowSpan - 10/rem) + 'rem',
                    top: shot.position.rowIndex + 'rem',
                    left: shot.position.colIndex + 'rem'
                })

                shotBlock.append(shotImg);
                shotsDiv.append(shotBlock);

                if(shot.picAreaInShot && shot.picAreaInShot.startLoc && shot.picAreaInShot.startLoc != -1){
                    shotImg.data('area',shot.picAreaInShot);
                    clipImage(shotImg);
                }
                else{
                    shotImg.css({
                        width: "100%",
                        height: "100%"
                    });
                }
            }
            else if(shotType == 'text'){
                shotText = $('<p>',{class:shot.content.charStyle}).text(shot.content.text);
                shotBlock = $('<div>',{class:'text-shot'});
                shotBlock.css({
                    "text-align": shot.content.alignment,
                    top: caculateTextPosition()

                })
                
                shotBlock.append(shotText);
                shotsDiv.append(shotBlock);
                textHeight += shotBlock.height()/rem;
            }
        }

    }

    var callback = function(mockData){
        //auto adaptation, calculate rem, if failed then default will be 50px
        var calculate_size = function () {
            var BASE_FONT_SIZE = 50,
                docEl = document.documentElement,
                clientWidth = docEl.clientWidth;
            if(clientWidth){
                docEl.style.fontSize = clientWidth / mockData.pictureStory.layout.cols + 'px';
            }
            else{
                docEl.style.fontSize = BASE_FONT_SIZE +'px';
            }
            
        };
          
        // Abort if browser does not support addEventListener
        if (document.addEventListener) {
            var resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize';
            var docBody = document.body;
            window.addEventListener(resizeEvt, calculate_size, false);
            document.addEventListener('DOMContentLoaded', calculate_size, false);
            calculate_size();
            docBody.style.display = 'block';
        }

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

        renderCover(mockData);
        renderShots(mockData.pictureStory.shots);
    }

    if(isDebug){
        callback(mockData);
    }
})