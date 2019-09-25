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
    mu: [],
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
        var arr;
        if (pop === 'mu') {
            arr = hb.mu;
            // limits of the search space
            hb.limits[0].min = 0;
            hb.limits[0].max = hb.spaces[1].image.naturalWidth - hb.wi;
            hb.limits[1].min = 0;
            hb.limits[1].max = hb.spaces[1].image.naturalHeight - hb.hi;
            hb.limits[2].min = 0;
            hb.limits[2].max = hb.wi;
            hb.limits[3].min = 0;
            hb.limits[3].max = hb.hi;
            hb.limits[4].min = 0;
            hb.limits[4].max = hb.wi;
            hb.limits[5].min = 0;
            hb.limits[5].max = hb.hi;
        }
        // empty population
        arr = [];
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
            arr.push(hb.individual(1, dim));
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
            image: i
        });
    },
    load: function () {
        // load frames
        var i = this.id.split('-')[1];
        hb.spaces[i].canvas.getContext('2d')
                .drawImage(hb.spaces[i].image, 0, 0);
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
        // get pixel data (r,g,b,a)
        var p1 = hb.spaces[i1.spc].canvas.getContext('2d')
                .getImageData(u1, v1, nx, ny).data;
        var p2 = hb.spaces[i2.spc].canvas.getContext('2d')
                .getImageData(u2, v2, nx, ny).data;
        // get mean
        var mean1 = 0;
        var mean2 = 0;
        for (var i = 0; i < nx * ny; i++) {
            var b = i * 4;
            mean1 += (p1[b] + p1[b + 1] + p1[b + 2]) / 3;
            mean2 += (p2[b] + p2[b + 1] + p2[b + 2]) / 3;
        }
        mean1 /= nx * ny;
        mean2 /= nx * ny;
        // get cross correlation and sums of squared errors
        var cross = 0;
        var sum1 = 0;
        var sum2 = 0;
        for (var i = 0; i < nx * ny; i++) {
            var b = i * 4;
            var err1 = ((p1[b] + p1[b + 1] + p1[b + 2]) / 3) - mean1;
            var err2 = ((p2[b] + p2[b + 1] + p2[b + 2]) / 3) - mean2;
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

        // initial position of the object
        hb.ui = 139.52;
        hb.vi = 58.571;
        hb.wi = 226.67 - 139.52;
        hb.hi = 148.57 - 58.571;

        // exploration
        hb.population('mu', 100);

        /*var i1 = hb.individual(0, [139.52, 58.571, 0, 0, 226.67 - 139.52, 148.57 - 58.571]);
        var i2 = hb.individual(1, [139.52 + 10, 58.571, 0, 0, 226.67 - 139.52, 148.57 - 58.571]);
        i1.fit = hb.ncc(i1, i2);*/

        // end timing
        hb.end = new Date();
        //hb.output('Similarity: ' + i1.fit + ' Time: ' + (hb.end - hb.start));
    }
};
// begin
$(document).ready(hb.read);