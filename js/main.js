// honeybee tracker
var honeybee = {
    individual: function (space, dimensions) {
        return {
            dimensions: dimensions,
            space: space
        };
    },
    ncc: function (i1, i2) {
        // starting points
        var u1 = i1.dimensions[0] + i1.dimensions[2];
        var v1 = i1.dimensions[1] + i1.dimensions[3];
        var u2 = i2.dimensions[0] + i2.dimensions[2];
        var v2 = i2.dimensions[1] + i2.dimensions[3];
        var nx = i1.dimensions[4];
        var ny = i1.dimensions[5];
        var mx = util.relation[i1.space].image.naturalWidth;
        var my = util.relation[i1.space].image.naturalHeight;
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
                mean1 += util.pixel(util.relation[i1.space].canvas, u1 + x, v1 + y);
                mean2 += util.pixel(util.relation[i2.space].canvas, u2 + x, v2 + y);
            }
        }
        mean1 /= nx * ny;
        mean2 /= nx * ny;
        // get cross correlation and sums of squared errors
        var cross = 0;
        var sigma1 = 0;
        var sigma2 = 0;
        for (var x = 0; x < nx; x++) {
            for (var y = 0; y < ny; y++) {
                var err1 = util.pixel(util.relation[i1.space].canvas, u1 + x, v1 + y) - mean1;
                var err2 = util.pixel(util.relation[i2.space].canvas, u2 + x, v2 + y) - mean2;
                cross += err1 * err2;
                sigma1 += err1 * err1;
                sigma2 += err2 * err2;
            }
        }
        // only real numbers
        if (sigma1 < 0 || sigma2 < 0 || sigma1 * sigma2 <= 0) {
            return -100;
        }
        // result
        return cross / Math.sqrt(sigma1 * sigma2);
    }
}
// utilities
var util = {
    loaded: 0,
    relation: [
        {
            file: 'img/00000001.jpg',
            label: 'f',
            canvas: null,
            image: null
        },
        {
            file: 'img/00000002.jpg',
            label: 't',
            canvas: null,
            image: null
        }
    ],
    output: function (text) {
        // print text
        $('#output').append(text + '\n');
    },
    pixel: function (canvas, x, y) {
        // get pixel from canvas
        return (canvas.context.getImageData(x, y, 1, 1).data[0] +
                canvas.context.getImageData(x, y, 1, 1).data[1] +
                canvas.context.getImageData(x, y, 1, 1).data[2]) / 3;
    },
    load: function () {
        // load frames
        var i = this.id.split('-')[1];
        util.relation[i].canvas = document.createElement('canvas');
        var context = util.relation[i].canvas.getContext('2d');
        context.drawImage(util.relation[i].image, 0, 0);
        loaded++;
        if (loaded === util.relation.length) {
            util.output('All frames loaded');
            util.process();
        }
    },
    read: function () {
        // read frames
        loaded = 0;
        for (var i = 0; i < util.relation.length; i++) {
            util.relation[i].image = new Image();
            util.relation[i].image.id = 'c-' + i;
            util.relation[i].image.src = util.relation[i].file;
            util.relation[i].image.onload = util.load;
        }
    },
    process: function () {
        util.output('Process started');
        var i1 = honeybee.individual(0, [139.52, 58.571, 0, 0, 226.67 - 139.52, 148.57 - 58.571]);
        var i2 = honeybee.individual(1, [139.52, 58.571, 0, 0, 226.67 - 139.52, 148.57 - 58.571]);
        var ncc = honeybee.ncc(i1, i2);
        util.output('NCC:' + ncc);
    }
};
// begin
$(document).ready(util.read);