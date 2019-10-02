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
        fo: {
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
            hb.ini.ex.mu = 50;
            hb.ini.ex.lambda = hb.ini.ex.mu * 2;
            hb.ini.ex.cross = 0.1;
            hb.ini.ex.mut = 0.6;
            hb.ini.ex.rand = 0.3;
            hb.ini.fo.mu = hb.ini.ex.mu * 10;
            hb.ini.fo.lambda = hb.ini.fo.mu * 2;
            hb.ini.fo.cross = 0.3;
            hb.ini.fo.mut = 0.6;
            hb.ini.fo.rand = 0.1;
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
            hb.space.arr[i].can.width = hb.space.arr[i].img.naturalWidth;
            hb.space.arr[i].can.height = hb.space.arr[i].img.naturalHeight;
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
        hb.lim[2].max = 0;//hb.ini.w - 1;
        hb.lim[3].min = 0;
        hb.lim[3].max = 0;//hb.ini.h - 1;
        hb.lim[4].min = hb.ini.w;//0;
        hb.lim[4].max = hb.ini.w;
        hb.lim[5].min = hb.ini.h;//0;
        hb.lim[5].max = hb.ini.h;
        // initial search area
        var win = Math.floor(Math.max(hb.ini.w, hb.ini.h) / 2);
        var lim = [
            {
                min: hb.ini.u,
                max: hb.ini.u + win
            },
            {
                min: hb.ini.v,
                max: hb.ini.v + win
            }
        ];
        // empty population
        hb.pop.arr[hb.pop.mu] = [];
        // fill population
        for (var i = 0; i < size; i++) {
            var dim = [0, 0, 0, 0, 0, 0];
            // independent random components
            for (var j = 0; j < 2; j++) {
                dim[j] = hb.random(lim[j]);
            }
            // dependent random components
            for (var j = 2; j < 4; j++) {
                dim[j] = 0;
            }
            dim[4] = hb.ini.w;
            dim[5] = hb.ini.h;
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
        var mx = hb.space.arr[i1.spc].img.naturalWidth;
        var my = hb.space.arr[i1.spc].img.naturalHeight;
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
        var p1 = hb.space.arr[i1.spc].gr;
        var p2 = hb.space.arr[i2.spc].gr;
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
        if (sum1 * sum2 <= 0) {
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
    tour: {
        pos: 0,
        list: [],
        shuffle: function () {
            hb.tour.list = [];
            for (var i = 0; i < hb.pop.arr[hb.pop.mu].length; i++) {
                hb.tour.list.push(i);
            }
            for (var i = 0; i < hb.pop.arr[hb.pop.mu].length; i++) {
                var r1 = Math.ceil(Math.random() *
                        (hb.pop.arr[hb.pop.mu].length - 1));
                var r2 = Math.ceil(Math.random() *
                        (hb.pop.arr[hb.pop.mu].length - 1));
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
            if ((hb.pop.arr[hb.pop.mu].length - hb.tour.pos) < 2) {
                hb.tour.preselect();
            }
            // selections
            var winner = hb.tour.list[hb.tour.pos];
            var pick = hb.tour.list[hb.tour.pos + 1];
            // select the best
            if (hb.pop.arr[hb.pop.mu][pick].fit >
                    hb.pop.arr[hb.pop.mu][winner].fit) {
                winner = pick;
            }
            // update position
            hb.tour.pos += 2;
            return winner;
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
            nm -= (nc + nm + nr) - size;
        }
        if (nc + nm + nr < size) {
            nm += size - (nc + nm + nr);
        }
        // empty population
        hb.pop.arr[hb.pop.lambda] = [];
        // prepare tournament
        hb.tour.preselect();
        // mutation
        for (var i = 0; i < nm; i++) {
            // selection
            var m1 = hb.tour.select();
            // mutate
            hb.mutation(m1);
        }
        // crossover
        for (var i = 0; i < nc; i += 2) {
            var m1 = hb.tour.select();
            var m2 = hb.tour.select();
            hb.crossover(m1, m2);
        }
        // random
        for (var i = 0; i < nr; i++) {
            var dt = [];
            for (var j = 0; j < hb.pop.arr[hb.pop.mu][0].dim.length; j++) {
                dt.push(hb.random(hb.lim[j]));
            }
            hb.pop.arr[hb.pop.lambda].push(hb.individual(1, dt));
        }
    },
    delta: function (u, l, h) {
        var d = 0;
        var aa = 0;
        if (u >= 1 - 1e-9) {
            d = h;
        } else if (u <= 0 + 1e-9) {
            d = l;
        } else {
            if (u < 0.5) {
                aa = 2 * u + (1 - 2 * u) * Math.pow((1 + l),
                        (hb.ini.eta.m + 1));
                d = Math.pow(aa, (1 / (hb.ini.eta.m + 1))) - 1;
            } else {
                aa = 2 * (1 - u) + 2 * (u - 0.5) * Math.pow((1 - h),
                        (hb.ini.eta.m + 1));
                d = 1 - Math.pow(aa, (1 / (hb.ini.eta.m + 1)));
            }
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
            b = Math.pow(2 * u, (1 / (hb.ini.eta.c + 1)));
        } else {
            b = Math.pow((0.5 / (1 - u)), (1 / (hb.ini.eta.c + 1)));
        }
        return b;
    },
    mutation: function (m1) {
        // copy individual
        var dt = [];
        for (var j = 0; j < hb.pop.arr[hb.pop.mu][m1].dim.length; j++) {
            dt.push(hb.pop.arr[hb.pop.mu][m1].dim[j]);
        }
        hb.pop.arr[hb.pop.lambda].push(hb.individual(1, dt));
        var i = hb.pop.arr[hb.pop.lambda].length - 1;
        // for each site
        for (var s = 0; s < hb.pop.arr[hb.pop.lambda][i].dim.length; s++) {
            // get value
            var x = hb.pop.arr[hb.pop.lambda][i].dim[s];
            var r = hb.lim[s].max - hb.lim[s].min;
            // get distance min
            var l = (hb.lim[s].min - x) / r;
            if (l < -1.0) {
                l = -1.0;
            }
            // get distance max
            var h = (hb.lim[s].max - x) / r;
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
            hb.pop.arr[hb.pop.lambda][i].dim[s] += d;
            // limits
            if (hb.pop.arr[hb.pop.lambda][i].dim[s] < hb.lim[s].min) {
                hb.pop.arr[hb.pop.lambda][i].dim[s] = hb.lim[s].min;
            }
            if (hb.pop.arr[hb.pop.lambda][i].dim[s] > hb.lim[s].max) {
                hb.pop.arr[hb.pop.lambda][i].dim[s] = hb.lim[s].max;
            }
        }
    },
    crossover: function (m1, m2) {
        // create children
        hb.pop.arr[hb.pop.lambda].push(hb.individual(1, [0, 0, 0, 0, 0, 0]));
        hb.pop.arr[hb.pop.lambda].push(hb.individual(1, [0, 0, 0, 0, 0, 0]));
        var c1 = hb.pop.arr[hb.pop.lambda].length - 2;
        var c2 = hb.pop.arr[hb.pop.lambda].length - 1;
        for (var s = 0; s < hb.pop.arr[hb.pop.mu][m1].dim.length; s++) {
            // parents
            var p1 = hb.pop.arr[hb.pop.mu][m1].dim[s];
            var p2 = hb.pop.arr[hb.pop.mu][m2].dim[s];
            // limits
            var l = hb.lim[s].min;
            var h = hb.lim[s].max;
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
                var um = 1 - (0.5 / Math.pow(a, hb.ini.eta.c + 1));
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
            hb.pop.arr[hb.pop.lambda][c2].dim[s] = v2;
            hb.pop.arr[hb.pop.lambda][c1].dim[s] = v1;
            if (o) {
                hb.pop.arr[hb.pop.lambda][c2].dim[s] = v1;
                hb.pop.arr[hb.pop.lambda][c1].dim[s] = v2;
            }
        }
    },
    sort: {
        list: [],
        rec: function (l, r) {
            var lh = l;
            var rh = r;
            var i = hb.sort.list[l];
            while (l < r) {
                while ((-1 * hb.pop.arr[hb.pop.mulambda][hb.sort.list[r]].fit
                        >= -1 * hb.pop.arr[hb.pop.mulambda][i].fit)
                        && (l < r)) {
                    r--;
                }
                if (l !== r) {
                    hb.sort.list[l] = hb.sort.list[r];
                    l++;
                }
                while ((-1 * hb.pop.arr[hb.pop.mulambda][hb.sort.list[l]].fit
                        <= -1 * hb.pop.arr[hb.pop.mulambda][i].fit)
                        && (l < r)) {
                    l++;
                }
                if (l !== r) {
                    hb.sort.list[r] = hb.sort.list[l];
                    r--;
                }
            }
            hb.sort.list[l] = i;
            var p = l;
            l = lh;
            r = rh;
            if (l < p) {
                hb.sort.rec(l, p - 1);
            }
            if (r > p) {
                hb.sort.rec(p + 1, r);
            }
        },
        begin: function () {
            var e = hb.pop.arr[hb.pop.mulambda].length;
            hb.sort.list = [];
            for (var i = 0; i < e; i++) {
                hb.sort.list.push(i);
            }
            hb.sort.rec(0, e - 1);
        }
    },
    merge: function () {
        hb.pop.arr[hb.pop.mulambda] = [];
        for (var i = 0; i < hb.pop.arr[hb.pop.mu].length; i++) {
            hb.pop.arr[hb.pop.mulambda].push(hb.pop.arr[hb.pop.mu][i]);
        }
        for (var i = 0; i < hb.pop.arr[hb.pop.lambda].length; i++) {
            hb.pop.arr[hb.pop.mulambda].push(hb.pop.arr[hb.pop.lambda][i]);
        }
        hb.sort.begin();
        var mu = hb.pop.arr[hb.pop.mu].length;
        hb.pop.arr[hb.pop.mu] = [];
        for (var i = 0; i < mu; i++) {
            hb.pop.arr[hb.pop.mu].push(hb.pop.arr[
                    hb.pop.mulambda][hb.sort.list[i]]);
        }
    },
    recruit: {
        list: [],
        begin: function () {
            // assign recruits
            var sum = 0;
            for (var i = 0; i < hb.ini.ex.mu; i++) {
                if (hb.pop.arr[hb.pop.mu][i].fit > 0) {
                    sum += hb.pop.arr[hb.pop.mu][i].fit;
                }
            }
            for (var i = 0; i < hb.ini.ex.mu; i++) {
                var rec = hb.pop.arr[hb.pop.mu][i].fit * hb.ini.fo.mu / sum;
                if (rec > 0) {
                    hb.recruit.list.push(Math.floor(rec));
                }
            }
            // verify number of recruits
            sum = 0;
            for (var i = 0; i < hb.recruit.list.length; i++) {
                sum += hb.recruit.list[i];
            }
            if (sum > hb.ini.fo.mu) {
                hb.recruit.list[0] -= sum - hb.ini.fo.mu;
            }
            if (sum < hb.ini.fo.mu) {
                hb.recruit.list[0] += hb.ini.fo.mu - sum;
            }
            // change limits
            hb.lim[0].min = hb.pop.arr[hb.pop.mu][0].dim[0];
            hb.lim[0].max = hb.pop.arr[hb.pop.mu][0].dim[0];
            for (var i = 1; i < hb.recruit.list.length; i++) {
                if (hb.pop.arr[hb.pop.mu][i].dim[0] < hb.lim[0].min) {
                    hb.lim[0].min = hb.pop.arr[hb.pop.mu][i].dim[0];
                }
                if (hb.pop.arr[hb.pop.mu][i].dim[0] > hb.lim[0].max) {
                    hb.lim[0].max = hb.pop.arr[hb.pop.mu][i].dim[0];
                }
            }
            hb.lim[1].min = hb.pop.arr[hb.pop.mu][0].dim[1];
            hb.lim[1].max = hb.pop.arr[hb.pop.mu][0].dim[1];
            for (var i = 1; i < hb.recruit.list.length; i++) {
                if (hb.pop.arr[hb.pop.mu][i].dim[1] < hb.lim[1].min) {
                    hb.lim[1].min = hb.pop.arr[hb.pop.mu][i].dim[1];
                }
                if (hb.pop.arr[hb.pop.mu][i].dim[1] > hb.lim[1].max) {
                    hb.lim[1].max = hb.pop.arr[hb.pop.mu][i].dim[1];
                }
            }
            // new population
            hb.pop.arr[hb.pop.mulambda] = [];
            for (var i = 0; i < hb.recruit.list.length; i++) {
                for (var j = 0; j < hb.recruit.list[i]; j++) {
                    hb.pop.arr[hb.pop.mulambda].push(hb.pop.arr[hb.pop.mu][i]);
                }
            }
            hb.pop.arr[hb.pop.mu] = [];
            for (var i = 0; i < hb.pop.arr[hb.pop.mulambda].length; i++) {
                hb.pop.arr[hb.pop.mu].push(hb.pop.arr[hb.pop.mulambda][i]);
            }
            hb.pop.arr[hb.pop.mulambda] = [];
        }
    },
    main: function () {
        // start timing
        hb.time.start();
        // exploration
        hb.parents(hb.ini.ex.mu);
        hb.evaluate(hb.pop.mu);
        for (var i = 0; i < hb.ini.gens; i++) {
            hb.offspring(hb.ini.ex.lambda, hb.ini.ex.cross,
                    hb.ini.ex.mut, hb.ini.ex.rand);
            hb.evaluate(hb.pop.lambda);
            hb.merge();
        }
        // recreuitment
        /* hb.recruit.begin();
         // foraging
         for (var i = 0; i < hb.ini.gens / 2; i++) {
         hb.offspring(hb.ini.fo.lambda, hb.ini.fo.cross,
         hb.ini.fo.mut, hb.ini.fo.rand);
         hb.evaluate(hb.pop.lambda);
         hb.merge();
         }*/
        // end timing
        hb.output('Time: ' + hb.time.end() + ' ms');
        // draw results
        var ctx = $('#display')[0].getContext('2d');
        $('#display')[0].width = hb.space.arr[1].img.naturalWidth;
        $('#display')[0].height = hb.space.arr[1].img.naturalHeight;
        ctx.drawImage(hb.space.arr[1].img, 0, 0);
        var avg = 0;
        for (var i = 0; i < hb.pop.arr[hb.pop.mu].length; i++) {
            var i1 = hb.pop.arr[hb.pop.mu][i];
            var u1 = Math.floor(i1.dim[0] + i1.dim[2]);
            var v1 = Math.floor(i1.dim[1] + i1.dim[3]);
            var nx = Math.floor(i1.dim[4]);
            var ny = Math.floor(i1.dim[5]);
            ctx.strokeRect(u1, v1, nx, ny);
            avg += i1.fit;
        }
        avg /= hb.pop.arr[hb.pop.mu].length;
        hb.output('Average fitness: ' + avg);
    }
}
// start
$(document).ready(hb.start);