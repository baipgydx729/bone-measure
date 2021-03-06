/**
 * Created by along on 2017/2/10.
 * author : 阿龙
 * email : bpd729@gmail.com
 */


var addEvent = (function(window, undefined) {
        var _eventCompat = function(event) {
            var type = event.type;
            if (type == 'DOMMouseScroll' || type == 'mousewheel') {
                event.delta = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
            }
            //alert(event.delta);
            if (event.srcElement && !event.target) {
                event.target = event.srcElement;
            }
            if (!event.preventDefault && event.returnValue !== undefined) {
                event.preventDefault = function() {
                    event.returnValue = false;
                };
            }
            /*
             ......其他一些兼容性处理 */
            return event;
        };
        if (window.addEventListener) {
            return function(el, type, fn, capture) {
                if (type === "mousewheel" && document.mozHidden !== undefined) {
                    type = "DOMMouseScroll";
                }
                el.addEventListener(type, function(event) {
                    fn.call(this, _eventCompat(event));
                }, capture || false);
            }
        } else if (window.attachEvent) {
            return function(el, type, fn, capture) {
                el.attachEvent("on" + type, function(event) {
                    event = event || window.event;
                    fn.call(el, _eventCompat(event));
                });
            }
        }
        return function() {};
})(window);

var _defaultConfig = {
    container_margin: 20,                //边距
    container_strokeColor: '#6498d4',       //边框颜色
    baseLine_strokeColor: '#6498d4',        //辅助基线颜色
    attachCircle_strokeColor: '#6498d4',     //辅助圆颜色
    controlCircle_strokeColor: '#6498d4',    //控制圆颜色

    control_default_radius: 90,                  //默认圆半径
    control_default_angle: 25,                   //默认显示角度

    textLine_strokeColor: '#6498d4',
    text_Color: '#6498d4',
};

var containerShape,                  //容器
    backRaster,
    baseLine,                        //辅助基线
    attachCircle,                    //辅助圆
    controlCircle,                   //控制圆
    textLine,
    textTip;


;(function init() {
    backRaster = new Raster({ position: view.center });
    addEvent(document, "mousewheel", function(event) {
        if (event.delta < 0){
            backRaster.scale(0.9)
        }else if (event.delta > 0){
            backRaster.scale(1.1)
        }
    });
    document.getElementById('upload_btn').addEventListener("change",function (e) {
        var file = this.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e){
            backRaster.set({ source:  this.result })
        }
        _czc.push(["_trackEvent",'yixue','upload','image','','']);
    })

    containerShape = new Shape.Rectangle({
        point: view.bounds.point + _defaultConfig.container_margin,
        size: view.bounds.size - _defaultConfig.container_margin * 2,
        strokeColor: _defaultConfig.container_strokeColor,
        dashArray: [10, 4]
    });

    var _topPoint = view.center + new Point(0, _defaultConfig.control_default_radius);
    var bottomPoint = view.center - new Point(0, _defaultConfig.control_default_radius);
    var leftPoint = view.center - new Point(_defaultConfig.control_default_radius / 2, 0);
    var rightPoint = view.center + new Point(_defaultConfig.control_default_radius / 2, 0);

    drawChart(_topPoint, bottomPoint, leftPoint, rightPoint);
    new Group([baseLine, attachCircle, controlCircle, textLine, textTip]).rotate(_defaultConfig.control_default_angle);
})();


function drawChart(topPoint, bottomPoint, leftPoint, rightPoint) {
    var centerPoint = bottomPoint + (topPoint - bottomPoint) / 2;
    var verticalVector = (topPoint - bottomPoint);
    var horizontalVector = (leftPoint - rightPoint);

    if(horizontalVector.length>=verticalVector.length) return;

    if (!!baseLine) baseLine.remove();
    baseLine = new Path.Line({
        from: centerPoint + verticalVector * 20,
        to: centerPoint - verticalVector * 20,
        strokeColor: _defaultConfig.baseLine_strokeColor,
        dashArray: [10, 4]
    });

    if (!!attachCircle) attachCircle.remove();
    attachCircle = new Shape.Circle({
        center: centerPoint,
        radius: verticalVector.length / 2,
        strokeColor: _defaultConfig.attachCircle_strokeColor,
        dashArray: [10, 4]
    });

    if (!!textLine) textLine.remove();
    textLine = new Path.Line({
        name : 'textLine',
        from: centerPoint,
        to: centerPoint + new Point(200, 0),
        strokeColor: _defaultConfig.textLine_strokeColor,
        dashArray: [5, 2],
    });
    textLine.rotate(verticalVector.angle - 90, centerPoint)

    if (!!textTip) textTip.remove();
    textTip = new PointText({
        point: centerPoint + new Point(186, -3),
        content: Math.round(90 * (horizontalVector.length/verticalVector.length)),
        fillColor: _defaultConfig.text_Color,
        fontSize: 10
    });
    textTip.rotate(verticalVector.angle - 90, centerPoint)

    if (!!controlCircle) controlCircle.remove();
    controlCircle = new Path.Circle({
        name : 'controlCircle',
        center: centerPoint,
        radius: verticalVector.length / 2,
        strokeColor: _defaultConfig.controlCircle_strokeColor,
        selected: true,
    });
    controlCircle.position.selected = true;
    controlCircle.scale(horizontalVector.length / verticalVector.length, 1);
    controlCircle.rotate(verticalVector.angle + 90);

};


var selectItem, selectSegment, isDraging  = false, isDragBg = false;
function onMouseDown(event) {
    var hitResult = project.hitTest(event.point, {segments: true, stroke: true, tolerance: 10});
    if (!hitResult) return;
    selectItem = hitResult.item;
    if (hitResult.type == 'segment') {
        selectSegment = hitResult.segment;
    } else if (hitResult.type == 'stroke') {
        selectSegment = null;
        isDraging = true;
    }else{
        isDragBg= true;
    }
};

function onMouseDrag(event) {
    if (selectItem && selectSegment && selectItem.name == 'controlCircle') {
        var topPoint = selectSegment.index == 1 ? event.point : selectItem.segments[1].point;
        var bottomPoint = selectSegment.index == 3 ? event.point : selectItem.segments[3].point;
        var leftPoint = selectSegment.index == 0 ? event.point : selectItem.segments[0].point;
        var rightPoint = selectSegment.index == 2 ? event.point : selectItem.segments[2].point;
        drawChart(topPoint, bottomPoint, leftPoint, rightPoint);
    }
    if (isDraging) {
        baseLine.position += event.delta;
        attachCircle.position += event.delta;
        controlCircle.position += event.delta;
        textLine.position += event.delta;
        textTip.position += event.delta;
    }
    if(isDragBg){
       backRaster.position += event.delta;
    }
};

function onMouseUp(event) {
    selectItem = selectSegment = null;
    isDragBg = isDraging = false;
};


