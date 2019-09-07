/* global cv */

// unlock screen
$("#loading").hide();

// load image files
$("#frame1").prop("src", "img/lol.png");
$("#frame0").prop("src", "img/lol_l.png");

// wait for image
var frame0_loaded = false;
var frame1_loaded = false;
$("#frame0").on("load", function () {
    frame0_loaded = true;
});
$("#frame1").on("load", function () {
    frame1_loaded = true;
});

// main loop
var state = 0;
setInterval(main, 60);
function main() {
    if (frame0_loaded && frame1_loaded && state === 0) {
        $("#output_text").append("Image frames loaded!\n");
        state = 1;
    }
    if (state === 1) {
        $("#output_text").append("Using NCC...\n");
        state = 2;
    }
}