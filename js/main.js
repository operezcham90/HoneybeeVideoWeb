var img = new Image();
img.src = 'img/test.png';
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
context.drawImage(img, 0, 0);

$('#output_text').append(JSON.stringify(context.getImageData(2, 2, 1, 1).data) + '\n');
$('#output_text').append(JSON.stringify(context.getImageData(1, 1, 1, 1).data) + '\n');