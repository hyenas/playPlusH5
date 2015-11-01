/**
 * $.mobileSlider
 * @charset utf-8
 * @author zhangyang
 * @version 1.0
 * @date 2015-9-15
 * @example
 * $(".slider").mobileSlider({
 *     blocks:["images/1.jpg","images/2.jpg","images/3.jpg","images/4.jpg"],
 *     width: 375,
 *     height: 216,
 *     switcher: true,
 *     during: 3000,
 *     speed: 100
 * })
 */
(function($){
    $.fn.mobileSlider = function(settings){
        var defaultSettings = {
            links:[],
            width: $(window).width(), //container width
            height: $(window).width() * 0.47, //container height
            switcher: false, //switcher
            during: 5000, //interval
            speed:30 //slide speed
        }

        settings = $.extend(true, {}, defaultSettings, settings);

        return this.each(function(){
            //global variable
            var _this = $(this), s = settings;
            var startX = 0, startY = 0;
            var temPos; //temp position
            var iCurr = 1; //current page
            var timer = null; // timer handle
            var oPosition = {}; //touch position
            var moveWidth = s.width; //move width
            var oriWidth = $(window).width();

            //init container style
            _this.width(s.width).height(s.height).css({
                position: 'relative',
                overflow: 'hidden'
            });
            _this.empty();

            //init slides list
            var blocks = settings.blocks,
                l = blocks.length;
            if(l==0){
                console.log("images is required");
                return;
            }

            if(l==1){

                _this.append("<img src="+ blocks[0] +">");
                return;
            }

            var oMover = $("<ul>").appendTo(_this);

            for(var i=0; i<l; i++){
                oMover.append(blocks[i]);
            }
            oMover.prepend(blocks[l-1]);
            oMover.append(blocks[0]);

            var oLi = $("li", oMover);
            var lgh = oLi.length;
            var num = lgh -2; //page number

            oLi.width(s.width).height(s.height);
            oMover.width((lgh) * oLi.width());

            oMover.css({
                padding:0,
                margin:0,
                position: 'absolute',
                left: 0-s.width
            });
            oLi.css({
                float: 'left',
                display: 'inline',
                height: $(window).height(),
                width: $(window).width(),
                background: '#333',
                border: 'none'
            });

            //$("img",_this).on('load',onImageLoad);
            $("img",_this).each(function(index, el) {
                var li = $(el).parents('li'),
                    liWidth = li.width(),
                    liHeight = li.height(),
                    elWidth = $(el).width(),
                    elHeight = $(el).height();

                if(elWidth/elHeight > liWidth/liHeight){
                    $(el).css({
                        display: 'block',
                        width: '100%'
                    })
                    // $(el).css({
                    //     'margin-top': (liHeight - elHeight)/2 + 'px'
                    // })
                }
                else(
                    $(el).css({
                        display: 'block',
                        height: '100%',
                        margin: '0 auto'
                    })
                )
            });

            $("p",_this).each(function(index,el){
                var li = $(el).parents('li'),
                    liWidth = li.width(),
                    liHeight = li.height(),
                    elWidth = $(el).width(),
                    elHeight = $(el).height();

                $(el).css({
                    padding: '0 15px',
                    'margin-top': (liHeight - elHeight)/2 + 'px'
                })
            });
            
            bindTochuEvent();
            autoMove();

            function autoMove(){
                if(s.switcher){
                    timer = setInterval(doMove, s.during);
                }
            }

            function stopMove(){
                clearInterval(timer);
            }
            
            function doMove(){
                iCurr = iCurr > num  ? 0 : iCurr + 1;
                doAnimate(-moveWidth * iCurr,function(){
                    if(iCurr == num + 1){
                        iCurr = 1;
                        oMover[0].style.left = -moveWidth +'px';
                    }
                });
            }

            function doAnimate(iTarget, fn){
                oMover.animate({
                    left: iTarget
                }, _this.speed , function(){
                    if (fn) 
                        fn();
                });
            }

            function onImageLoad(evt){
                var img = $(evt.currentTarget),
                    div = img.parent().parent;
            }

            function bindTochuEvent(){
                oMover.get(0).addEventListener('touchstart', touchStartFunc, false);
                oMover.get(0).addEventListener('touchmove', touchMoveFunc, false);
                oMover.get(0).addEventListener('touchend', touchEndFunc, false);
            }
            
            function touchStartFunc(e){
                clearInterval(timer);
                getTouchPosition(e);
                startX = oPosition.x;
                startY = oPosition.y;
                temPos = oMover.position().left;
            }
            
            function touchMoveFunc(e){
                getTouchPosition(e);
                var moveX = oPosition.x - startX;
                var moveY = oPosition.y - startY;
                if (Math.abs(moveY) < Math.abs(moveX)) {
                    e.preventDefault();
                    oMover.css({
                        left: temPos + moveX
                    });
                }
            }
            
            function touchEndFunc(e){
                getTouchPosition(e);
                var moveX = oPosition.x - startX;
                var moveY = oPosition.y - startY;
                if (Math.abs(moveY) < Math.abs(moveX)) {
                    if (moveX > 0) {
                        iCurr--;
                        if (iCurr > 0 && iCurr <= num) {
                            var moveX = iCurr * moveWidth;
                            doAnimate(-moveX, autoMove);
                        }
                        else if(iCurr==0){
                            doAnimate(0,function(){
                                iCurr = num;
                                oMover[0].style.left = -moveWidth * num +'px';
                                autoMove();
                            });
                        }
                        else if(iCurr == num + 1){
                            doAnimate(-moveWidth * iCurr,function(){
                                iCurr = 1;
                                oMover[0].style.left = -moveWidth +'px';
                                autoMove();
                            });
                        }
                    }
                    else {
                        iCurr++;
                        if (iCurr <= num && iCurr > 0) {
                            var moveX = iCurr * moveWidth;
                            doAnimate(-moveX, autoMove);
                        }
                        else if(iCurr==0){
                            doAnimate(0,function(){
                                iCurr = num;
                                oMover[0].style.left = -moveWidth * num +'px';
                                autoMove();
                            });
                        }
                        else if(iCurr == num + 1){
                            doAnimate(-moveWidth * iCurr,function(){
                                iCurr = 1;
                                oMover[0].style.left = -moveWidth +'px';
                                autoMove();
                            });
                        }
                    }
                }
            }

            function scale(){
                var iScale = $(window).width() / oriWidth;
                oriWidth = $(window).width();
                s.width *=  iScale;
                s.height *=  iScale;
                moveWidth = s.width;

                _this.height(s.height).width(s.width);
                oMover.css({
                    left: -(iCurr+1) * s.width
                });
            }
            
            function getTouchPosition(e){
                var touches = e.changedTouches,
                    l = touches.length,
                    touch,
                    tagX,
                    tagY;
                for (var i = 0; i < l; i++) {
                    touch = touches[i];
                    tagX = touch.clientX;
                    tagY = touch.clientY;
                }
                oPosition.x = tagX;
                oPosition.y = tagY;
                return oPosition;
            }
        });
    }
})(Zepto);
