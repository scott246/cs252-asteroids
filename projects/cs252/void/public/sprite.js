
(function() {
    function Sprite(url, pos, size) {
        this.pos = pos;
        this.size = size;
        this._index = 0;
        this.url = url;
    };

    Sprite.prototype = {

        render: function(ctx) {
            var x = this.pos[0];
            var y = this.pos[1];

            ctx.drawImage(resources.get(this.url),
                          x, y,
                          this.size[0], this.size[1],
                          0, 0,
                          this.size[0], this.size[1]);
        }
    };

    window.Sprite = Sprite;
})();