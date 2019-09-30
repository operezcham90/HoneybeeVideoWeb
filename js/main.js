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
    main: function () {
        // start timing
        hb.time.start();
        // exploration
        hb.parents(hb.ini.ex.mu);
        /*hb.evaluate(hb.pop.mu);
         for (var i = 0; i < hb.ini.gens; i++) {
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