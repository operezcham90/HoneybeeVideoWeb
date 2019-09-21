// global variables
var images = [];
var canvases = [];
var loaded_images = 0;

// utilities
var Util = {
    output: function (text) {
        $('#output').append(text + '\n');
    }
};

// get pixel color
function get_color(canvas, x, y) {
    return canvas.context.getImageData(x, y, 1, 1).data;
}

// load all the frames
function load_frames() {
    loaded_images = 0;
    for (var i = 0; i < 2; i++) {
        images[i] = new Image();
        images[i].id = JSON.stringify({'img': i});
        images[i].src = 'img/test.png';
        images[i].onload = loaded_frame;
    }
}

// wait for the loaded frame
function loaded_frame() {
    var i = JSON.parse(this.id).img;
    canvases[i] = document.createElement('canvas');
    var context = canvases[i].getContext('2d');
    context.drawImage(images[i], 0, 0);
    loaded_images++;
    if (loaded_images === images.length) {
        output('All frames loaded');
    }
}

$(document).ready(load_frames);