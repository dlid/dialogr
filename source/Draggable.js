// Not currently used
var dragObj = null;
function draggable(id)
{
    var obj = document.getElementById(id);
    obj.style.position = "absolute";
    obj.onmousedown = function(e){
        console.warn("down",e);
        dragObj = obj;
    }
}
 
document.onmouseup = function(e){
    dragObj = null;
};

document.onmousemove = function(e){
    var x = e.pageX;
    var y = e.pageY;

    if(dragObj == null)
        return;

    dragObj.style.left = x + STYLE_UNIT_PIXELS;
    dragObj.style.top= y + STYLE_UNIT_PIXELS;
};
