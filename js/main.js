/* global cv */

// unlock screen
$("#loading").hide();

// load an image file
$("#loader").prop("src", "img/lol.png");

// convert to mat
let mat = cv.imread($("#loader"));
cv.imshow($("#output"), mat);
mat.delete();