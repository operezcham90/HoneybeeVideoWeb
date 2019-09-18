var img = new Image();
img.src = 'img/test.png';
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
context.drawImage(img, 0, 0);
alert(JSON.stringify(context.getImageData(2, 2, 1, 1).data));