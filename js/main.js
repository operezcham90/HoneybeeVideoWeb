// honeybee tracker
var hb = {
    loaded: 0,
    spaces: [],
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
    pixel: function (spc, x, y) {
        // get pixel from canvas
        return (hb.spaces[spc].canvas.getContext('2d')
                .getImageData(x, y, 1, 1).data[0] +
                hb.spaces[spc].canvas.getContext('2d')
                .getImageData(x, y, 1, 1).data[1] +
                hb.spaces[spc].canvas.getContext('2d')
                .getImageData(x, y, 1, 1).data[2]) / 3;
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
        var u1 = i1.dim[0] + i1.dim[2];
        var v1 = i1.dim[1] + i1.dim[3];
        var u2 = i2.dim[0] + i2.dim[2];
        var v2 = i2.dim[1] + i2.dim[3];
        var nx = i1.dim[4];
        var ny = i1.dim[5];
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
        // get mean
        var mean1 = 0;
        var mean2 = 0;
        for (var x = 0; x < nx; x++) {
            for (var y = 0; y < ny; y++) {
                mean1 += hb.pixel(i1.spc, u1 + x, v1 + y);
                mean2 += hb.pixel(i2.spc, u2 + x, v2 + y);
            }
        }
        mean1 /= nx * ny;
        mean2 /= nx * ny;
        // get cross correlation and sums of squared errors
        var cross = 0;
        var sum1 = 0;
        var sum2 = 0;
        for (var x = 0; x < nx; x++) {
            for (var y = 0; y < ny; y++) {
                var err1 = hb.pixel(i1.spc, u1 + x, v1 + y) - mean1;
                var err2 = hb.pixel(i2.spc, u2 + x, v2 + y) - mean2;
                cross += err1 * err2;
                sum1 += err1 * err1;
                sum2 += err2 * err2;
            }
        }
        // only real numbers
        if (sum1 < 0 || sum2 < 0 || sum1 * sum2 <= 0) {
            return -100;
        }
        // result
        return cross / Math.sqrt(sum1 * sum2);
    },
    process: function () {
        hb.output('Process started');
        var i1 = hb.individual(0, [139.52, 58.571, 0, 0, 226.67 - 139.52, 148.57 - 58.571]);
        var i2 = hb.individual(1, [139.52 + 10, 58.571, 0, 0, 226.67 - 139.52, 148.57 - 58.571]);
        i1.fit = hb.ncc(i1, i2);
        hb.output('Similarity: ' + i1.fit);
    }
};
// begin
$(document).ready(hb.read);