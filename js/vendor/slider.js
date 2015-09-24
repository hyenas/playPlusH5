/**
 * $.mobileSlider
 * @charset utf-8
 * @author zhangyang
 * @version 1.0
 * @date 2015-9-15
 * @example
 * $(".slider").mobileSlider({
 *     images:["images/1.jpg","images/2.jpg","images/3.jpg","images/4.jpg"],
 *     links:["wanlitong.com","wanlitong.com","wanlitong.com","wanlitong.com"],
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
            var imgs = settings.images,
                links = settings.links,
                l = imgs.length;
            if(l==0){
                console.log("images is required");
                return;
            }

            if(l==1){
                if(links[0]){
                    _this.append("<a href='" + links[0] + "'><img src="+ imgs[0] +"></a>");
                }
                else{
                    _this.append("<a><img src="+ imgs[0] +"></a>");
                }
                return;
            }

            var oMover = $("<ul>").appendTo(_this);

            for(var i=0; i<l; i++){
                if(links[i]){
                    oMover.append("<li><a href='" + links[i] + "'><img src="+ imgs[i] +"></a></li>");
                }
                else{
                    oMover.append("<li><a><img src="+ imgs[i] +"></a></li>");
                }
            }
            oMover.prepend("<li><a><img src="+ imgs[l-1] +"></a></li>");
            oMover.append("<li><a><img src="+ imgs[0] +"></a></li>");

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
                display: 'inline'
            });
            $("img", oLi).css({
                width: '100%',
                height: '100%'
            });

            //init focus
            _this.append('<div class="slide-focus"><div></div></div>');
            var oFocusContainer = $(".slide-focus");
            for (var i = 0; i < num; i++) {
                $("div", oFocusContainer).append("<span></span>");
            }
            var oFocus = $("span", oFocusContainer);
            oFocusContainer.width(s.width).height(s.height * 0.15).css({
                zIndex: 2,
                minHeight: $(this).find('span').height() * 2,
                position: 'absolute',
                bottom: 0
            });
            $("span", oFocusContainer).css({
                display: 'block',
                float: 'left',
                cursor: 'pointer'
            });
            $("div", oFocusContainer).width(20 * (num)).css({
                'min-height': 20,
                position: 'absolute',
                right: 10,
                top: '50%',
                marginTop: -$(this).find('span').width() / 2
            });
            oFocus.first().addClass("current");

            $(window).bind('resize', function(){
                scale();
                oLi.width(s.width).height(s.height);
                oMover.width((lgh) * oLi.width());
                oFocusContainer.width(_this.width()).height(_this.height() * 0.15).css({
                    zIndex: 2
                });//设定焦点容器宽高样式
                _this.fadeIn(300);
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
                    oFocus.eq(iCurr-1).addClass("current").siblings().removeClass("current");
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
                            correctFocus(iCurr);
                        }
                        else if(iCurr==0){
                            doAnimate(0,function(){
                                iCurr = num;
                                oMover[0].style.left = -moveWidth * num +'px';
                                autoMove();
                                correctFocus(iCurr);
                            });
                        }
                        else if(iCurr == num + 1){
                            doAnimate(-moveWidth * iCurr,function(){
                                iCurr = 1;
                                oMover[0].style.left = -moveWidth +'px';
                                autoMove();
                                correctFocus(iCurr);
                            });
                        }
                    }
                    else {
                        iCurr++;
                        if (iCurr <= num && iCurr > 0) {
                            var moveX = iCurr * moveWidth;
                            doAnimate(-moveX, autoMove);
                            correctFocus(iCurr);
                        }
                        else if(iCurr==0){
                            doAnimate(0,function(){
                                iCurr = num;
                                oMover[0].style.left = -moveWidth * num +'px';
                                autoMove();
                                correctFocus(iCurr);
                            });
                        }
                        else if(iCurr == num + 1){
                            doAnimate(-moveWidth * iCurr,function(){
                                iCurr = 1;
                                oMover[0].style.left = -moveWidth +'px';
                                autoMove();
                                correctFocus(iCurr);
                            });
                        }
                    }
                }
            }

            function correctFocus(iCurr){
                oFocus.eq(iCurr-1).addClass("current").siblings().removeClass("current");
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
