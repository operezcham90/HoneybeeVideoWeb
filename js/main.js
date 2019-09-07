/* global cv */

// unlock screen
$("#loading").hide();

// load an image file
$("#loader").prop("src", "img/lol.png");

// convert to mat
$("#loader").on("load", function () {
    let mat = cv.imread($("#loader").get(0));
    cv.imshow("output", mat);
    $("#mu_e").val(mat.at(cv.Point(10, 10)));
    mat.delete();
});