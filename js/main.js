/* global cv */

// unlock screen
$("#loading").hide();

// load an image file
$("#loader").prop("src", "img/lol.png");

// convert to mat
$("#loader").on("load", function () {
    let mat = cv.imread($("#loader").get(0));
    cv.imshow("output", mat);
    mat.delete();
});