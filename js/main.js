// utilities
var util = {
    loaded: 0,
    relation: [
        {
            file: 'img/test.png',
            label: 'f',
            canvas: null,
            image: null
        },
        {
            file: 'img/test.png',
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
        return canvas.context.getImageData(x, y, 1, 1).data;
    },
    load: function () {
        var i = this.id.split('-')[1];
        util.relation[i].canvas = document.createElement('canvas');
        var context = util.relation[i].canvas.getContext('2d');
        context.drawImage(util.relation[i].image, 0, 0);
        loaded++;
        if (loaded === util.relation.length) {
            output('All frames loaded');
        }
    },
    read: function () {
        // read frames
        loaded = 0;
        for (var i = 0; i < util.relation.length; i++) {
            util.relation[i].image = new Image();
            util.relation[i].image.id = 'c-' + i;
            util.relation[i].image.src = util.relation[i].file;
            util.relation[i].image.onload = load;
        }
    }
};

// begin
$(document).ready(util.read);