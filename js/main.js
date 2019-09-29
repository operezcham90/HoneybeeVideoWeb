'use strict'
// honeybee tracker
var hb = {
    ini: {
        // initial
        u: 0,
        v: 0,
        h: 0,
        w: 0,
        gens: 0,
        eta: {
            m: 0,
            c: 0
        },
        ex: {
            mu: 0,
            lambda: 0,
            cross: 0,
            mut: 0,
            rand: 0
        },
        fo: {
            mu: 0,
            lambda: 0,
            cross: 0,
            mut: 0,
            rand: 0
        },
        read: function () {
            // variables
            hb.ini.gens = 3;
            hb.ini.ex.mu = 100;
            hb.ini.ex.lambda = hb.ini.ex.mu * 2;
            hb.ini.ex.cross = 0.1;
            hb.ini.ex.mut = 0.6;
            hb.ini.ex.rand = 0.3;
            hb.ini.eta.m = 25;
            hb.ini.eta.c = 2;
            // initial known position
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
    pop: {
        mu: 0,
        lambda: 1,
        mulambda: 2,
        arr: [[], [], []]
    },
    limits: [
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0},
        {min: 0, max: 0}
    ],
    spaces: {
        loaded: 0,
        arr: []
    },
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
        hb.limits[0].max = hb.spaces.arr[1].image.naturalWidth - hb.wi - 1;
        hb.limits[1].min = 0;
        hb.limits[1].max = hb.spaces.arr[1].image.naturalHeight - hb.hi - 1;
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
    delta: function (u, l, h) {
        var d = 0;
        var aa = 0;
        if (u < 0.5) {
            aa = 2 * u + (1 - 2 * u) *
                    Math.pow((1 + l), (hb.eta.m + 1));
            d = Math.pow(aa, (1 / (hb.eta.m + 1))) - 1;
        } else {
            aa = 2 * (1 - u) + 2 * (u - 0.5) *
                    Math.pow((1 - h), (hb.eta.m + 1));
            d = 1 - Math.pow(aa, (1 / (hb.eta.m + 1)));
        }
        // correction
        if (d < -1) {
            d = -1;
        }
        if (d > 1) {
            d = 1;
        }
        return d;
    },
    beta: function (u) {
        var b;
        if (1 - u < 1e-6) {
            u = 1 - 1e-6;
        }
        if (u < 0) {
            u = 0;
        }
        if (u < 0.5) {
            b = Math.pow(2 * u, (1 / (hb.eta.c + 1)));
        } else {
            b = Math.pow((0.5 / (1 - u)), (1 / (hb.eta.c + 1)));
        }
        return b;
    },
    mutation: function (i) {
        // for each site
        for (var s = 0; s < hb.populations[hb.lambda][i].dim.length - 2; s++) {
            // get value
            var x = hb.populations[hb.lambda][i].dim[s];
            var r = hb.limits[s].max - hb.limits[s].min;
            if (s >= 4) {
                // dependent components
                r -= hb.populations[hb.lambda][i].dim[s - 2];
            }
            // get distance min
            var l = (hb.limits[s].min - x) / r;
            if (l < -1.0) {
                l = -1.0;
            }
            // get distance max
            var h = (hb.limits[s].max - x) / r;
            if (s >= 4) {
                // dependent components
                h = (hb.limits[s].max - x -
                        hb.populations[hb.lambda][i].dim[s - 2]) / r;
            }
            if (h > 1.0) {
                h = 1.0;
            }
            // fix delta
            if (-1 * l < h) {
                h = -1 * l;
            } else {
                l = -1 * h;
            }
            var u = Math.random();
            // actual delta
            var d = hb.delta(u, l, h) * r;
            hb.populations[hb.lambda][i].dim[s] += d;
            // limits
            if (hb.populations[hb.lambda][i].dim[s] < hb.limits[s].min) {
                hb.populations[hb.lambda][i].dim[s] = hb.limits[s].min;
            }
            if (hb.populations[hb.lambda][i].dim[s] > hb.limits[s].max) {
                hb.populations[hb.lambda][i].dim[s] = hb.limits[s].max;
            }
        }
    },
    crossover: function (m1, m2) {
        // create children
        hb.populations[hb.lambda].push(hb.individual(1, [0, 0, 0, 0, 0, 0]));
        hb.populations[hb.lambda].push(hb.individual(1, [0, 0, 0, 0, 0, 0]));
        var c1 = hb.populations[hb.lambda].length - 2;
        var c2 = hb.populations[hb.lambda].length - 1;
        for (var s = 0; s < hb.populations[hb.mu][m1].dim.length; s++) {
            // parents
            var p1 = hb.populations[hb.mu][m1].dim[s];
            var p2 = hb.populations[hb.mu][m2].dim[s];
            // limits
            var l = hb.limits[s].min;
            var h = hb.limits[s].max;
            // check order
            var o = false;
            if (p1 > p2) {
                var t = p1;
                p1 = p2;
                p2 = t;
                o = true;
            }
            // mean and difference
            var m = (p1 + p2) * 0.5;
            var d = p2 - p1;
            // check limits
            var r = 0;
            if ((p1 - l) < (h - p2)) {
                r = p1 - l;
            } else {
                r = h - p2;
            }
            if (r < 0) {
                r = 0;
            }
            // check difference
            var u = 0;
            if (d > 1e-6) {
                var a = 1 + (2 * r / d);
                var um = 1 - (0.5 / Math.pow(a, hb.eta.c + 1));
                u = um * Math.random();
            } else {
                u = Math.random();
            }
            // get beta
            var b = hb.beta(u);
            if (Math.abs(d * b) > Number.POSITIVE_INFINITY) {
                b = Number.POSITIVE_INFINITY / d;
            }
            // get values
            var v2 = m + (b * 0.5 * d);
            var v1 = m - (b * 0.5 * d);
            // limits
            if (v2 < l) {
                v2 = l;
            }
            if (v2 > h) {
                v2 = h;
            }
            if (v1 < l) {
                v1 = l;
            }
            if (v1 > h) {
                v1 = h;
            }
            // children
            hb.populations[hb.lambda][c2].dim[s] = v2;
            hb.populations[hb.lambda][c1].dim[s] = v1;
            if (o) {
                hb.populations[hb.lambda][c2].dim[s] = v1;
                hb.populations[hb.lambda][c1].dim[s] = v2;
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
        // crossover
        for (var i = 0; i < nc; i += 2) {
            var m1 = hb.tour.select();
            var m2 = hb.tour.select();
            hb.crossover(m1, m2);
        }
    },
    merge: function () {
        return 0;
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
            hb.populations[pop][i].fit = hb.ncc(hb.populations[pop][i], i2);
        }
    },
    space: function (file) {
        // create a search space
        var i = new Image();
        i.id = 'c-' + hb.spaces.arr.length;
        i.src = file;
        i.onload = hb.load;
        hb.spaces.arr.push({
            file: file,
            canvas: document.createElement('canvas'),
            image: i,
            gray: []
        });
    },
    load: function () {
        // load frames
        var i = this.id.split('-')[1];
        hb.spaces.arr[i].canvas.getContext('2d')
                .drawImage(hb.spaces.arr[i].image, 0, 0);
        var data = hb.spaces.arr[i].canvas
                .getContext('2d')
                .getImageData(0, 0,
                        hb.spaces.arr[i].image.naturalWidth,
                        hb.spaces.arr[i].image.naturalHeight).data;
        for (var j = 0; j < (data.length / 4); j++) {
            var b = j * 4;
            hb.spaces.arr[i].gray[j] =
                    (data[b] + data[b + 1] + data[b + 2]) / 3;
        }
        hb.spaces.loaded++;
        if (hb.spaces.loaded === 2) {
            hb.output('All frames loaded');
            hb.process();
        }
    },
    read: function () {
        // read two frames
        hb.spaces.loaded = 0;
        hb.spaces.arr = [];
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
    process: function () {
        // start timing
        hb.time.start();
        // configuration
        hb.ini.read();
        // exploration
        hb.parents(hb.ini.ex.mu);
        hb.evaluate(hb.pop.mu);
        for (var i = 0; i < hb.ini.gens; i++) {
            hb.offspring(hb.ex.lambda, hb.ex.cross, hb.ex.mut, hb.ex.rand);
            hb.evaluate(hb.pop.lambda);
            hb.merge();
        }
        // end timing
        hb.output('Time: ' + hb.time.end() + ' ms');
    }
};
// begin
$(document).ready(hb.read);