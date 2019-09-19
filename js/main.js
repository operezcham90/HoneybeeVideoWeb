var img = new Image();
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
}