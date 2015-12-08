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
    work.presentationHeight = $(window).width();

    work.init = function(){
        //define global variable
        // online this._URL = 'http://api.playplus.me/v1.0/shares/works/';
        this._URL = 'http://test.www.playplus.me/shares/works/';
        this.textHeight = 0;
        this.mask = "<span class='loading'><span>";
        
        window.addEventListener("orientationchange" in window ? "orientationchange" : "resize", work.onResize, false);

        work.bindtTransform();
    };

    work.action = function(){
        var me = this;
        //load data
        $.ajax({
            type: 'GET',
            dataType: 'json',
            headers:{
                'X-Request-ID': PP.getUUID(),
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

        $('header div.mask').css('display','block')
        $('.loadApp').css('display','block');
        me.renderCover(mockData);
        me.renderShots(mockData.story.shots);
    };

    work.assemblySlider = function(data){
        var i,
            l = data.length,
            slideArr = [],
            textBlock,
            slideLi;

        for(i=0; i<l; i++){
            if(data[i].content.type == 'image'){
                slideLi = "<li><img src=" + data[i].content.bodyFile.url+"/cm480x" + "></li>";
                slideArr.push(slideLi);
            }
            else if(data[i].content.type == 'text'){
                slideLi = "<li><p class='" + data[i].content.charStyle + "' style=\"text-align:" + data[i].content.alignment + ";\">" + data[i].content.text + "</p></li>";
                slideArr.push(slideLi);
            }

        }

        return slideArr;
    };  

    work.moveSlider = function(index){
        $('ul',$(".presentation")).css({
            left: '-' + index * $(window).width()
        })
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
        div.css('background-color','#000');
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
        img.css('display','block');
    };

    work.hideLoading = function(evt){
        var img = $(evt.currentTarget),
            div = img.parent();
        img.css({
            visibility:'visible'
        });
        $('.loading',div).hide();
        div.css('background-color','#000');
    }

    //render the header
    work.renderCover = function(mockData){
        var me=this;
        var banner = $('header .banner');
        var text = $('header div.title');
        var title = $('<p>',{class:'title'}).text(mockData.title);
        var subtitle = $('<p>',{class:'subtitle'}).text(mockData.subtitle);
        var cover=mockData.story.cover;

        var coverImg = $('<img>',{src: mockData.story.cover.pictureUrl});
        if (mockData.story.cover.content.type == 'video') {
            coverImg = $('<video loop muted>',{src: mockData.story.cover.content.bodyFile.url});
        }

        if (mockData.story.cover.content.type == 'image') {
            coverImg = $('<img>',{src: mockData.story.cover.content.bodyFile.url+"/cm480x"});
        }


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
        var i;
        var shot;
        var shotType;
        var length = shots.length;
        var shotsDiv = $('#shotsDiv');
        var shotBlock;
        var shotImg;
        var shotText;
        var rem = parseInt(document.documentElement.style.fontSize);
        var me = this;

        $("#shotsDiv").empty();

        for(i=0; i<length; i++){
            shot = shots[i];
            shotType = shot.content.type;

            if(shotType == 'image' || shotType == 'video'){
                if (shotType == 'image') {
                    shotImg = $('<img>',{src:shot.content.bodyFile.url});
                } 
                if (shotType == 'video') {
                    shotImg = $('<video loop muted>',{src:shot.content.bodyFile.url});
                }
                shotBlock = $('<div>',{class:'img-shot','data-idx':i});
                 
                shotBlock.css({
                    width: (shot.size.colSpan - 6/rem) + 'rem',
                    height: (shot.size.rowSpan - 6/rem) + 'rem',
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

            if(shotType == 'text'){
                shotText = $('<p>',{class:shot.content.charStyle}).text(shot.content.text);
                shotBlock = $('<div>',{class:'text-shot','data-idx':i});
                shotBlock.css({
                    "text-align": shot.content.alignment,
                    top: me.caculateTextPosition() + 3,
                    margin: '10px'

                })
                
                shotBlock.append(shotText);
                shotsDiv.append(shotBlock);
                me.textHeight = me.textHeight + (shotBlock.height()+20)/rem - shot.size.rowSpan;
            }
        }

        var offsetDiv = $("<div class='offset'><div>")
        offsetDiv.css({
            width: '100%',
            height: '.88rem',
            top: me.caculateTextPosition(),
            left:0,
            margin:'6px 0 0 0'
        })
        shotsDiv.append(offsetDiv);
        $('body').css('background-color', '#000');
    };

    work.onResize = function(){
        if($(window).width() < $(window).height()){
            $('.stream').css("display","block");
            $('.presentation').hide();
            $('body').css({
                'overflow': 'scroll'
            })
            work.presentationHeight = $(window).width();
            work.textHeight = 0;
            work.callback(work.data);
        }
        else{
            $('.stream').hide();
            $('.presentation').css({
                display:'block'
            });

           $(".presentation").empty();
           
           $(".presentation").mobileSlider({
                blocks: work.assemblySlider(work.data.presentation.slides),
                width: $(window).width(),
                height: $(window).height(),
                during: 3000,
                speed: 300
            })

        }
    }

    work.bindtTransform = function() {
        $('#shotsDiv').on('click','div',function(event){
            var currentIndex = $(event.currentTarget).data('idx');
            $('.stream').hide();
            $('.presentation').css({
                display: "block",
            });
            
            $(".presentation").empty();

            $(".presentation").carousel({
                blocks: work.assemblySlider(work.data.presentation.slides),
                width: $(window).width(),
                height: $(window).height(),
                during: 3000,
                speed: 300,
                index: currentIndex + 1
            })

        })
    };

    $(function(){
        work.init();
        work.action();
    });


    // window.onscroll = function () {
    //     loadImages();
    // };
    
})
