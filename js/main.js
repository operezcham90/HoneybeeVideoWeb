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

// global variables
var src;
var templ;
var dst;
var mask;

// main loop
var state = 0;
setInterval(main, 60);
function main() {
    if (frame0_loaded && frame1_loaded && state === 0) {
        $("#output_text").append("Image frames loaded!\n");
        src = cv.imread('frame1');
        templ = cv.imread('frame0');
        dst = new cv.Mat();
        mask = new cv.Mat();
        cv.imshow('output0', src);
        cv.imshow('output1', templ);
        state = 1;
    }
    if (state === 1) {
        $("#output_text").append("Using NCC...\n");
        cv.matchTemplate(src, templ, dst, cv.TM_CCORR_NORMED, mask);
        cv.imshow('output2', dst);
        state = 2;
    }
}