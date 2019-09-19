// global variables
var images = [];
var canvases = [];

function load_frames() {
    for (var i = 0; i < 2; i++) {
        images[i] = new Image();
        images[i].id = JSON.stringify({'img': 0});
        images[i].src = 'img/test.png';
        images[i].onload = loaded_frame;
    }
}

function loaded_frame() {
    alert(this.id);
}

/*img.onload = function () {
 var canvas = document.createElement('canvas');
 var context = canvas.getContext('2d');
 context.drawImage(img, 0, 0, img.width, img.height);
 for (var i = 0; i < 2; i++) {
 for (var j = 0; j < 2; j++) {
 $('#output_text').append(JSON.stringify(context.getImageData(i, j, 1, 1).data));
 }
 }
 }
 
 var f = read_frame('img/test.png');
 alert(f.get_color(1, 1));*/