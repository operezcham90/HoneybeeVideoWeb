// global variables
var images = [];
var canvases = [];

// get pixel color
function get_color(canvas, x, y) {
    return canvas.context.getImageData(x, y, 1, 1).data;
}

// write to output text
function output(text) {
    $('#output_text').append(text + '\n');
}

// load all the frames
function load_frames() {
    for (var i = 0; i < 2; i++) {
        images[i] = new Image();
        images[i].id = JSON.stringify({'img': i});
        images[i].src = 'img/test.png';
        images[i].onload = loaded_frame;
    }
}

// wait for the loaded frame
function loaded_frame() {
    var all = true;
    for (var j = 0; j < images.length; j++) {
        all &= images[j].complete;
    }
    var i = JSON.parse(this.id).img;
    canvases[i] = document.createElement('canvas');
    var context = canvases[i].getContext('2d');
    context.drawImage(images[i], 0, 0);
    if (all) {
        output('All frames loaded' + i);
    }
}

$(document).ready(load_frames);