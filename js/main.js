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
    gens: 0,
    eta: {
        m: 0,
        c: 0
    },
    exp: {
        mu: 0,
        lambda: 0,
        cross: 0,
        mut: 0,
        rand: 0
    },
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
    tour: {
        pos: 0,
        list: [],
        shuffle: function () {
            hb.tour.list = [];
            for (var i = 0; i < hb.populations[hb.mu].length; i++) {
                hb.tour.list.push(i);
            }
            for (var i = 0; i < hb.populations[hb.mu].length; i++) {
                var r1 = Math.ceil(Math.random() *
                        (hb.populations[hb.mu].length - 1));
                var r2 = Math.ceil(Math.random() *
                        (hb.populations[hb.mu].length - 1));
                var t = hb.tour.list[r1];
                hb.tour.list[r1] = hb.tour.list[r2];
                hb.tour.list[r2] = t;
            }
        },
        preselect: function () {
            hb.tour.shuffle();
            hb.tour.pos = 0;
        },
        select: function () {
            // emergency reset
            if ((hb.populations[hb.mu].length - hb.tour.pos) < 2) {
                hb.tour.preselect();
            }
            // selections
            var winner = hb.tour.list[hb.tour.pos];
            var pick = hb.tour.list[hb.tour.pos + 1];
            // select the best
            if (hb.populations[hb.mu][pick].fit >
                    hb.populations[hb.mu][winner].fit) {
                winner = pick;
            }
            // update position
            hb.tour.pos += 2;
            return winner;
        }
    },
    random: function (limits) {
        return (Math.random() * (limits.max - limits.min)) + limits.min;
    },
    parents: function (size) {
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
        // empty population
        hb.populations[hb.mu] = [];
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
            hb.populations[hb.mu].push(hb.individual(1, dim));
        }
    },
    delta: function (u, delta_l, delta_u) {
        var delta = 0;
        var aa = 0;
        // weird value
        if (u >= 1.0 - 1.0e-9) {
            delta = delta_u;
        } else if (u <= 0.0 + 1.0e-9) {
            delta = delta_l;
        } else {
            if (u < 0.5) {
                aa = 2.0 * u + (1.0 - 2.0 * u) *
                        Math.pow((1 + delta_l), (hb.eta.m + 1.0));
                delta = Math.pow(aa, (1.0 / (hb.eta.m + 1.0))) - 1.0;
            } else {
                aa = 2.0 * (1 - u) + 2.0 * (u - 0.5) *
                        Math.pow((1 - delta_u), (hb.eta.m + 1.0));
                delta = 1.0 - Math.pow(aa, (1.0 / (hb.eta.m + 1.0)));
            }
        }
        // correction
        if (delta < -1.0) {
            delta = -1.0;
        }
        if (delta > 1.0) {
            delta = 1.0;
        }
        return delta;
    },
    mutation: function (i) {
        // for each site
        for (var s = 0; s < hb.populations[hb.lambda][i].dim.length; s++) {
            // get value
            var x = hb.populations[hb.lambda][i].dim[s];
            // get distance min
            var d1 = hb.limits[s].min - x;
            var delta_l = d1 / (hb.limits[s].min - hb.limits[s].max);
            if (delta_l < -1.0) {
                delta_l = -1.0;
            }
            // get distance max
            d1 = hb.limits[s].max - x;
            var delta_u = d1 / (hb.limits[s].min - hb.limits[s].max);
            if (delta_u > 1.0) {
                delta_u = 1.0;
            }
            // fix delta
            if (-1.0 * delta_l < delta_u) {
                delta_u = -1.0 * delta_l;
            } else {
                delta_l = -1.0 * delta_u;
            }
            var u = Math.random();
            // actual delta
            var delta = hb.delta(u, delta_l, delta_u) *
                    (hb.limits[s].min - hb.limits[s].max);
            hb.populations[hb.lambda].dim[s] += delta;
            // limits
            if (hb.populations[hb.lambda].dim[s] < hb.limits[s].min) {
                hb.populations[hb.lambda].dim[s] = hb.limits[s].min;
            }
            if (hb.populations[hb.lambda].dim[s] > hb.limits[s].max) {
                hb.populations[hb.lambda].dim[s] = hb.limits[s].max;
            }
        }
    },
    offspring: function (size, cross, mut, rand) {
        // set number of individuals
        var nc = size * cross;
        var nm = size * mut;
        var nr = size * rand;
        // verify number of individuals
        if (nc % 2 !== 0) {
            nc++;
        }
        if (nc + nm + nr > size) {
            nc -= (nc + nm + nr) - size;
        }
        if (nc + nm + nr < size) {
            nm += size - (nc + nm + nr);
        }
        // empty population
        hb.populations[hb.lambda] = [];
        // prepare tournament
        hb.tour.preselect();
        // mutation
        for (var i = 0; i < nm; i++) {
            // selection
            var m1 = hb.tour.select();
            // copy individual
            var dt = [];
            for (var j = 0; j < hb.populations[hb.mu][m1].dim.length; j++) {
                dt.push(hb.populations[hb.mu][m1].dim[j]);
            }
            hb.populations[hb.lambda].push(hb.individual(1, dt));
            // mutate
            hb.mutation(hb.populations[hb.lambda].length - 1);
        }
    },
    merge: function () {

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
        // configuration
        hb.gens = 3;
        hb.exp.mu = 100;
        hb.exp.lambda = hb.exp.mu * 2;
        hb.exp.cross = 0.1;
        hb.exp.mut = 0.6;
        hb.exp.rand = 0.3;
        hb.eta.m = 25;
        hb.eta.c = 2;
        // initial known position of the object
        hb.ui = 139.52;
        hb.vi = 58.571;
        hb.wi = 226.67 - 139.52;
        hb.hi = 148.57 - 58.571;
        // exploration
        hb.parents(hb.exp.mu);
        hb.evaluate(hb.mu);
        for (var i = 0; i < hb.gens; i++) {
            hb.offspring(hb.exp.lambda, hb.exp.cross, hb.exp.mut, hb.exp.rand);
            hb.evaluate(hb.lambda);
            hb.merge();
        }
        // end timing
        hb.end = new Date();
        hb.output('Time: ' + (hb.end - hb.start) + ' ms');
    }
};
// begin
$(document).ready(hb.read);