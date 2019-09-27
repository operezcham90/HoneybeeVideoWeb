'use strict'
// honeybee tracker
var hb = {
    loaded: 0,
    start: new Date(),
    end: new Date(),
    ui: 0,
    vi: 0,
    hi: 0,
    wi: 0,
    mu: 0,
    lambda: 1,
    mulambda: 2,
    populations: [[], [], []],
    limits: [
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0}
    ],
    spaces: [],
    random: function (limits) {
        return (Math.random() * (limits.max - limits.min)) + limits.min;
    },
    population: function (pop, size) {
        if (pop === hb.mu) {
            // limits of the search space
            hb.limits[0].min = 0;
            hb.limits[0].max = hb.spaces[1].image.naturalWidth - hb.wi - 1;
            hb.limits[1].min = 0;
            hb.limits[1].max = hb.spaces[1].image.naturalHeight - hb.hi - 1;
            hb.limits[2].min = 0;
            hb.limits[2].max = hb.wi - 1;
            hb.limits[3].min = 0;
            hb.limits[3].max = hb.hi - 1;
            hb.limits[4].min = 0;
            hb.limits[4].max = hb.wi - 1;
            hb.limits[5].min = 0;
            hb.limits[5].max = hb.hi - 1;
        }
        // empty population
        hb.populations[pop] = [];
        // fill population
        for (var i = 0; i < size; i++) {
            var dim = [0, 0, 0, 0, 0, 0];
            // independent random components
            for (var j = 0; j < 4; j++) {
                dim[j] = hb.random(hb.limits[j]);
            }
            // dependent random components
            for (var j = 4; j < 6; j++) {
                dim[j] = hb.random({
                    min: hb.limits[j].min,
                    max: hb.limits[j].max - dim[j - 2]
                });
            }
            hb.populations[pop].push(hb.individual(1, dim));
        }
    },
    evaluate: function (pop) {
        for (var i = 0; i < hb.populations[pop].length; i++) {
            // known position
            var i2 = hb.individual(0, [
                hb.ui,
                hb.vi,
                hb.populations[pop][i].dim[2],
                hb.populations[pop][i].dim[3],
                hb.populations[pop][i].dim[4],
                hb.populations[pop][i].dim[5]
            ]);
            // comparison
            hb.populations[pop][i].fit
                    = hb.ncc(hb.populations[pop][i], i2);
        }
    },
    space: function (file) {
        // create a search space
        var i = new Image();
        i.id = 'c-' + hb.spaces.length;
        i.src = file;
        i.onload = hb.load;
        hb.spaces.push({
            file: file,
            canvas: document.createElement('canvas'),
            image: i,
            gray: []
        });
    },
    load: function () {
        // load frames
        var i = this.id.split('-')[1];
        hb.spaces[i].canvas.getContext('2d')
                .drawImage(hb.spaces[i].image, 0, 0);
        var data = hb.spaces[i].canvas
                .getContext('2d')
                .getImageData(0, 0,
                        hb.spaces[i].image.naturalWidth,
                        hb.spaces[i].image.naturalHeight).data;
        for (var j = 0; j < (data.length / 4); j++) {
            var b = j * 4;
            hb.spaces[i].gray[j] = (data[b] + data[b + 1] + data[b + 2]) / 3;
        }
        hb.loaded++;
        if (hb.loaded === 2) {
            hb.output('All frames loaded');
            hb.process();
        }
    },
    read: function () {
        // read two frames
        hb.loaded = 0;
        hb.spaces = [];
        for (var i = 0; i < 2; i++) {
            hb.space('img/0000000' + (i + 1) + '.jpg');
        }
    },
    output: function (text) {
        // print text
        $('#output').append(text + '\n');
    },
    individual: function (spc, dimensions) {
        return {
            dim: dimensions,
            spc: spc,
            fit: 0
        };
    },
    ncc: function (i1, i2) {
        // starting points from individuals
        var u1 = Math.floor(i1.dim[0] + i1.dim[2]);
        var v1 = Math.floor(i1.dim[1] + i1.dim[3]);
        var u2 = Math.floor(i2.dim[0] + i2.dim[2]);
        var v2 = Math.floor(i2.dim[1] + i2.dim[3]);
        var nx = Math.floor(i1.dim[4]);
        var ny = Math.floor(i1.dim[5]);
        var mx = hb.spaces[i1.spc].image.naturalWidth;
        var my = hb.spaces[i1.spc].image.naturalHeight;
        // negative values
        if (nx < 0 || ny < 0 || mx < 0 || my < 0) {
            return -100;
        }
        // window not inside frame
        if (u1 + nx >= mx || u2 + nx >= mx || v1 + ny >= my || v2 + ny >= my ||
                u1 < 0 || u2 < 0 || v1 < 0 || v2 < 0) {
            return -100;
        }
        // get pixel data
        var p1 = hb.spaces[i1.spc].gray;
        var p2 = hb.spaces[i2.spc].gray;
        // get mean
        var mean1 = 0;
        var mean2 = 0;
        for (var i = 0; i < nx * ny; i++) {
            mean1 += p1[i];
            mean2 += p2[i];
        }
        mean1 /= nx * ny;
        mean2 /= nx * ny;
        // get cross correlation and sums of squared errors
        var cross = 0;
        var sum1 = 0;
        var sum2 = 0;
        for (var i = 0; i < nx * ny; i++) {
            var b = i * 4;
            var err1 = p1[i] - mean1;
            var err2 = p2[i] - mean2;
            cross += err1 * err2;
            sum1 += err1 * err1;
            sum2 += err2 * err2;
        }
        // only real numbers
        if (sum1 < 0 || sum2 < 0 || sum1 * sum2 <= 0) {
            return -100;
        }
        // result
        return cross / Math.sqrt(sum1 * sum2);
    },
    process: function () {
        // start timing
        hb.start = new Date();

        // initial known position of the object
        hb.ui = 139.52;
        hb.vi = 58.571;
        hb.wi = 226.67 - 139.52;
        hb.hi = 148.57 - 58.571;

        // exploration
        hb.population(hb.mu, 100);
        hb.evaluate(hb.mu);

        // end timing
        hb.end = new Date();
        hb.output('Time: ' + (hb.end - hb.start));
    }
};
// begin
$(document).ready(hb.read);