var PP = (function(){
    return{
        getURLParam: function(name) { 
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
            var r = window.location.search.substr(1).match(reg); 
            if (r != null) return unescape(r[2]); return null; 
        },
        getUUID: function(){
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
        },
        setREM: function(){
            var calculate_size = function () {
                var BASE_FONT_SIZE = 50,
                    docEl = document.documentElement,
                    clientWidth = docEl.clientWidth;
                if(clientWidth){
                    docEl.style.fontSize = clientWidth / arguments[0] + 'px';
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
                calculate_size(arguments[0]);
                docBody.style.display = 'block';
            }
        },
        orient:function(){
            //alert('gete');
            if (window.orientation == 0 || window.orientation == 180) {
                $("body").attr("class", "portrait");
                orientation = 'portrait';
                return false;
            }
            else if (window.orientation == 90 || window.orientation == -90) {
                $("body").attr("class", "landscape");
                orientation = 'landscape';
                   return false;
            }
        }
    }

})();