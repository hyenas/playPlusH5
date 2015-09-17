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
    var URL = 'http://120.55.148.102/v1.0/shares/works/';

    //define global variable
    var textHeight = 0;

    var getURLParam = function(name) { 
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
        var r = window.location.search.substr(1).match(reg); 
        if (r != null) return unescape(r[2]); return null; 
    } 

    var getUUID  = function(){
        var dec2hex = [];
        for (var i=0; i<=15; i++) {
          dec2hex[i] = i.toString(16);
        }     

        var uuid = '';
        for (var i=1; i<=36; i++) {
            if (i===9 || i===14 || i===19 || i===24) {
                uuid += '-';
            } else if (i===15) {
                uuid += 4;
            } else if (i===20) {
                uuid += dec2hex[(Math.random()*4|0 + 8)];
            } else {
                uuid += dec2hex[(Math.random()*15|0)];
            }
        }
        return uuid;
    }

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

    var centerCrop = function(evt){
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
    }

    //render the header
    var renderCover = function(mockData){
        var banner = $('header .banner'),
            text = $('header div.title'),
            coverImg = $('<img>',{src: mockData.pictureStory.cover.pictureUrl}),
            title = $('<p>',{class:'title'}).text(mockData.title),
            subtitle = $('<p>',{class:'subtitle'}).text(mockData.subtitle),
            cover=mockData.pictureStory.cover;

        banner.append(coverImg);
        text.append(title).append(subtitle);

        if(cover.picArea && cover.picArea.startLoc && cover.picArea.startLoc.xPct != -1){
            coverImg.data('area',cover.picArea);
            clipImage(coverImg);
        }
        else if(cover.picArea && cover.picArea.startLoc && cover.picArea.startLoc.xPct == -1){
            coverImg.on('load',centerCrop);
        }
        else{
            coverImg.css({
                width: "100%",
                height: "100%"
            });
        }

        //img.on('load',centerCrop)
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

                if(shot.picAreaInShot && shot.picAreaInShot.startLoc && shot.picAreaInShot.startLoc.xPct != -1){
                    shotImg.data('area',shot.picAreaInShot);
                    clipImage(shotImg);
                }
                else if(shot.picAreaInShot && shot.picAreaInShot.startLoc && shot.picAreaInShot.startLoc.xPct == -1){
                    shotImg.data('area',shot.size);
                    shotImg.on('load',centerCrop);
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

        $('header div.mask').show();
        $('.loadApp').show();
        renderCover(mockData);
        renderShots(mockData.pictureStory.shots);
    }

    // window.onscroll = function () {
    //     loadImages();
    // };


    //load data
    $.ajax({
        type: 'GET',
        dataType: 'json',
        headers:{
            'X-Request-ID': getUUID()
        },
        url: URL + getURLParam('workId'),
        jsonpCallback:'jsonp1',
        cache: true,
        success:function(data) {
            callback(data);
        },
        error:function(data) {
            // body...
        }
    });
})