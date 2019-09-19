function read_frame(url) {
    var frame = {
        img: new Image(),
        ctx: document.createElement('canvas'),
        rdy: false,
        get_color: function (x, y) {
            return this.ctx.getImageData(x, y, 1, 1).data;
        }
    };
    frame.img.onload = function () {
        frame.ctx.drawImage(frame.img, 0, 0, frame.img.width, frame.img.height);
        frame.rdy = true;
    };
    frame.img.src = url;
    while (!frame.rdy) {
    }
    return frame;
}

/*var img = new Image();
 img.src = 'img/test.png';
 img.onload = function () {
 var canvas = document.createElement('canvas');
 var context = canvas.getContext('2d');
 context.drawImage(img, 0, 0, img.width, img.height);
 for (var i = 0; i < 2; i++) {
 for (var j = 0; j < 2; j++) {
 $('#output_text').append(JSON.stringify(context.getImageData(i, j, 1, 1).data));
 }
 }
 }*/

var f = read_frame('img/test.png');
alert(f.get_color(1, 1));