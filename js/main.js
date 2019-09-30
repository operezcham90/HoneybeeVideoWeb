'use strict'
// honeybee tracker
var hb = {
    output: function (txt) {
        // print text
        $('#output').append(txt + '\n');
    },
    ini: {
        gens: 0,
        u: 0,
        v: 0,
        h: 0,
        w: 0,
        ex: {
            mu: 0,
            lambda: 0,
            cross: 0,
            mut: 0,
            rand: 0
        },
        eta: {
            m: 0,
            c: 0
        },
        frame: {
            curr: 0
        },
        read() {
            hb.ini.frame.curr = 2;
            hb.ini.gens = 3;
            hb.ini.ex.mu = 100;
            hb.ini.ex.lambda = hb.ini.ex.mu * 2;
            hb.ini.ex.cross = 0.1;
            hb.ini.ex.mut = 0.6;
            hb.ini.ex.rand = 0.3;
            hb.ini.eta.m = 25;
            hb.ini.eta.c = 2;
            hb.ini.u = Math.ceil(139.52);
            hb.ini.v = Math.ceil(58.571);
            hb.ini.w = Math.ceil(226.67 - 139.52);
            hb.ini.h = Math.ceil(148.57 - 58.571);
        }
    },
    time: {
        // measure time
        s: new Date(),
        e: new Date(),
        start: function () {
            hb.time.s = new Date();
        },
        end: function () {
            hb.time.e = new Date();
            return hb.time.e - hb.time.s;
        }
    },
    space: {
        loaded: 0,
        arr: [],
        pad: function (n, l) {
            n += '';
            while (n.length < l) {
                n = '0' + n;
            }
            return n;
        },
        load: function () {
            // load frames
            var i = this.id.split('-')[1];
            hb.space.arr[i].can.getContext('2d')
                    .drawImage(hb.space.arr[i].img, 0, 0);
            var d = hb.space.arr[i].can
                    .getContext('2d').getImageData(0, 0,
                    hb.space.arr[i].img.naturalWidth,
                    hb.space.arr[i].img.naturalHeight).data;
            for (var j = 0; j < (d.length / 4); j++) {
                var b = j * 4;
                hb.space.arr[i].gr[j] = (d[b] + d[b + 1] + d[b + 2]) / 3;
            }
            hb.space.loaded++;
            if (hb.space.loaded === 2) {
                hb.output('All frames loaded');
                hb.main();
            }
        },
        create: function (file) {
            // create a search space
            var img = new Image();
            img.id = 'c-' + hb.space.arr.length;
            img.src = file;
            img.onload = hb.space.load;
            hb.space.arr.push({
                can: document.createElement('canvas'),
                img: img,
                gr: []
            });
        },
        read: function () {
            // read two frames
            hb.space.loaded = 0;
            hb.space.arr = [];
            for (var i = hb.ini.frame.curr - 1; i <= hb.ini.frame.curr; i++) {
                var file = 'img/' + hb.space.pad(i, 8) + '.jpg';
                hb.space.create(file);
            }
        }
    },
    start: function () {
        hb.ini.read();
        hb.space.read();
    },
    lim: [
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0}
    ],
    pop: {
        mu: 0,
        lambda: 1,
        mulambda: 2,
        arr: [[], [], []]
    },
    parents: function (size) {
        // actual limits of the search space
        hb.lim[0].min = 0;
        hb.lim[0].max = hb.space.arr[1].img.naturalWidth - hb.ini.w - 1;
        hb.lim[1].min = 0;
        hb.lim[1].max = hb.space.arr[1].img.naturalHeight - hb.ini.h - 1;
        hb.lim[2].min = 0;
        hb.lim[2].max = hb.ini.w - 1;
        hb.lim[3].min = 0;
        hb.lim[3].max = hb.ini.h - 1;
        hb.lim[4].min = 0;
        hb.lim[4].max = hb.ini.w - 1;
        hb.lim[5].min = 0;
        hb.lim[5].max = hb.ini.h - 1;
        // initial search area
        var win = Math.ceil(Math.max(hb.ini.w, hb.ini.h) / 8);
        var lim = [
            {
                min: hb.ini.u - win,
                max: hb.ini.u + win
            },
            {
                min: hb.ini.v - win,
                max: hb.ini.v + win
            },
            {
                min: hb.ini.w - win,
                max: hb.ini.w - 1
            },
            {
                min: hb.ini.h - win,
                max: hb.ini.h - 1
            },
            {
                min: hb.ini.w - win,
                max: hb.ini.w - 1
            },
            {
                min: hb.ini.h - win,
                max: hb.ini.h - 1
            }
        ];
        // empty population
        hb.pop.arr[hb.pop.mu] = [];
        // fill population
        for (var i = 0; i < size; i++) {
            var dim = [0, 0, 0, 0, 0, 0];
            // independent random components
            for (var j = 0; j < 4; j++) {
                dim[j] = hb.random(lim[j]);
            }
            // dependent random components
            for (var j = 4; j < 6; j++) {
                dim[j] = hb.random({
                    min: lim[j].min,
                    max: lim[j].max - dim[j - 2]
                });
            }
            hb.pop.arr[hb.pop.mu].push(hb.individual(1, dim));
        }
    },
    random: function (limits) {
        return (Math.random() * (limits.max - limits.min)) + limits.min;
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
        var mx = hb.spaces.arr[i1.spc].image.naturalWidth;
        var my = hb.spaces.arr[i1.spc].image.naturalHeight;
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
        var p1 = hb.spaces.arr[i1.spc].gray;
        var p2 = hb.spaces.arr[i2.spc].gray;
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
    evaluate: function (pop) {
        for (var i = 0; i < hb.pop.arr[pop].length; i++) {
            // known position
            var i2 = hb.individual(0, [
                hb.ui,
                hb.vi,
                hb.pop.arr[pop][i].dim[2],
                hb.pop.arr[pop][i].dim[3],
                hb.pop.arr[pop][i].dim[4],
                hb.pop.arr[pop][i].dim[5]
            ]);
            // comparison
            hb.pop.arr[pop][i].fit = hb.ncc(hb.pop.arr[pop][i], i2);
        }
    },
    main: function () {
        // start timing
        hb.time.start();
        // exploration
        hb.parents(hb.ini.ex.mu);
        hb.evaluate(hb.pop.mu);
        /* for (var i = 0; i < hb.ini.gens; i++) {
         hb.offspring(hb.ini.ex.lambda, hb.ini.ex.cross,
         hb.ini.ex.mut, hb.ini.ex.rand);
         hb.evaluate(hb.pop.lambda);
         hb.merge();
         }*/
        // end timing
        hb.output('Time: ' + hb.time.end() + ' ms');
    }
}
// start
$(document).ready(hb.start);