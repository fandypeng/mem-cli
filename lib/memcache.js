/**
 * 对memcache模块的扩展
 * Created by Fandy on 2016/10/13.
 */
var memcache = require('memcache');

module.exports = memcache;

memcache.Client.prototype.flush_all = function (callback) {
    return this.query('flush_all', 'simple', callback);
}

memcache.Client.prototype.keys = function (value, callback) {
    return this.query('stats cachedump ' + value + " 0" , 'cachedump', callback);
}

memcache.Client.prototype.handle_cachedump = function(buffer){

    // special case - no stats at all
    if (buffer.indexOf('END') == 0){
        return [{}, 5];
    }

    // find the terminator
    var idx = buffer.indexOf('\r\nEND\r\n');
    if (idx == -1){
        // wait for more data if we don't have an end yet
        return null;
    }

    // read the lines
    var our_data = buffer.substr(0, idx+2);
    var out = {};
    var line = null;
    var i=0;
    while (line = readLine(our_data)){
        our_data = our_data.substr(line.length + 2);
        if (line.substr(0, 5) == 'ITEM '){
            var idx2 = line.indexOf(' ', 5);
            var k = line.substr(5, idx2-5);
            var v = line.substr(idx2+1);
            out[k] = v;
        }
    }

    return [out, idx + 7, null];
};