'use strict'
// honeybee tracker
var hb = {
    output: function (txt) {
        // print text
        $('#output').append(txt + '\n');
    },
    ini: {
        frame: {
            curr: 2
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
        hb.space.read();
    },
    main: function () {
        hb.output('OK');
    }
}
// start
$(document).ready(hb.start);