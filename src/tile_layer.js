var util = require('./util'),
    request = require('./request');

module.exports = L.TileLayer.extend({

    // http://mapbox.com/developers/api/#image_quality
    formats: [
        // PNG
        'png32', 'png64', 'png128', 'png256',
        // JPG
        'jpg70', 'jpg80', 'jpg90'],

    initialize: function(_, options) {
        L.TileLayer.prototype.initialize.call(this, undefined, options);

        this._tilejson = {};

        if (options && options.detectRetina &&
            L.Browser.retina && options.retinaVersion) {
            _ = options.retinaVersion;
        }

        if (typeof _ === 'string') {
            mapbox.idUrl(_, this);
        } else if (_ && typeof _ === 'object') {
            this.setTileJSON(_);
        }
    },

    setTileJSON: function(json) {
        util.strict(json, 'object');

        L.extend(this.options, {
            tiles: json.tiles,
            attribution: json.attribution,
            minZoom: json.minzoom,
            maxZoom: json.maxzoom,
            tms: json.scheme === 'tms',
            bounds: json.bounds && util.lbounds(json.bounds)
        });

        this._tilejson = json;
        this.redraw();
        return this;
    },

    getTileJSON: function() {
        return this._tilejson;
    },

    loadURL: function(url, cb) {
        request(url, L.bind(function(err, json) {
            if (err) util.log('could not load TileJSON at ' + url);
            else if (json) this.setTileJSON(json);
            if (cb) cb.call(this, err, json);
        }, this));
        return this;
    },

    loadID: function(id, cb) {
        return this.loadURL(mapbox.base() + id + '.json', cb);
    },

    // this is an exception to mapbox.js naming rules because it's called
    // by `L.map`
    getTileUrl: function(tilePoint) {
        var tiles = this.options.tiles,
            index = (tilePoint.x + tilePoint.y) % tiles.length,
            url = tiles[index];

        return L.Util.template(url, tilePoint);
    },

    // TileJSON.TileLayers are added to the map immediately, so that they get
    // the desired z-index, but do not update until the TileJSON has been loaded.
    _update: function() {
        if (this.options.tiles) {
            L.TileLayer.prototype._update.call(this);
        }
    }
});