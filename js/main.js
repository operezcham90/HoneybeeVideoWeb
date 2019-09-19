function Frame(url) {
    this.img = new Image();
    this.ctx = document.createElement('canvas');
    this.img.src = url;
    this.ready = false;
    this.getColor = function (x, y) {
        return this.ctx.getImageData(x, y, 1, 1).data;
    };
    this.img.onload = function () {
        this.ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height);
        this.ready = true;
    };
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

var f = Frame('img/test.png');
while (!f.ready) {
}
alert(f.getColor(1, 1));