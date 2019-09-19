// global variables
var images = [];
var canvases = [];

function get_color(canvas) {
    canvas.getContext('2d')
}

function load_frames() {
    for (var i = 0; i < 2; i++) {
        images[i] = new Image();
        images[i].id = JSON.stringify({'img': i});
        images[i].src = 'img/test.png';
        images[i].onload = loaded_frame;
    }
}

function loaded_frame() {
    var i = JSON.parse(this.id).img;
    canvases[i] = document.createElement('canvas');
    var context = canvases[i].getContext('2d');
    context.drawImage(images[i], 0, 0);
    for (var x = 0; x < 2; x++) {
        for (var y = 0; y < 2; y++) {
            $('#output_text').append(JSON.stringify(context.getImageData(i, j, 1, 1).data));
        }
    }
}