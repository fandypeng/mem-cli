/**
 * memcache操作
 * Created by Fandy on 2016/10/12.
 */
var memcache = require('./memcache')
    ,argv    = require('argv')
    ,util    = require('util')
    ,package = require('../package.json')
    ,memcacheConfig = {host:'192.168.1.73', port: 12001}
    ,r
    ,memClient;

const repl = require('repl');

module.exports = MemcacheClient;

function MemcacheClient() {
    this.host = '';
    this.port = '';
    this.client = null;
    this.connected = false;
}

MemcacheClient.prototype.start = function () {

    var option = [
        {
            name: 'host',
            short: 'h',
            type: 'string',
            description: 'remote memcached host',
            example: "'mem-cli --host=ip' or 'mem-cli -h ip'"
        }, {
            name: 'port',
            short: 'p',
            type: 'int',
            description: 'remote memcached port',
            example: "'mem-cli --port=port' or 'mem-cli -p port'"
        }, {
            name: 'version',
            short: 'v',
            type: 'int',
            description: 'get mem-cli version',
            example: "'mem-cli -v'"
        }];
    args = argv.clear()
        .option( option )
        .run();

    if(args.options.host != NaN) {
        if(isIP(args.options.host)) {
            this.host = args.options.host;
        } else {
            console.log("ERROR HOST");
            process.exit();
        }
    }
    if(args.options.port != NaN) {
        if(util.isNumber(args.options.port) && !util.isNull(args.options.port)) {
            this.port = args.options.port;
        }
    }
    if(args.options.hasOwnProperty('version')) {
        console.log(package.version);
        process.exit();
    }

    function isIP(strIP) {
        if (util.isNull(strIP)) return false;
        var re=/^(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])$/ //匹配IP地址的正则表达式
        if(re.test(strIP))
        {
            if( RegExp.$1 <256 && RegExp.$2<256 && RegExp.$3<256 && RegExp.$4<256) return true;
        }
        return false;
    }

    this.connect();
}

MemcacheClient.prototype.connect = function () {
    this.host = this.host || memcacheConfig.host;
    this.port = this.port || memcacheConfig.port;
    this.client = new memcache.Client(this.port, this.host);

    memClient = this.client;

    this.client.on('connect', this.startMemCli);

    this.client.on('close', function () {
        this.connected = false;
        console.log("Connection closed by remote host, bye!");
        process.exit();
    });

    this.client.on('timeout', function(){
        // no arguments - socket timed out
        console.log("time out");
    });

    this.client.on('error', function(e){
        // there was an error - exception is 1st argument
        console.log(e);
    });

    this.client.connect();
}

MemcacheClient.prototype.startMemCli = function () {
    this.connected = true;
    r = repl.start({prompt: 'memcache ' + this.host + ':' + this.port + ' >', eval:execCmd});

    // 指定一些命令
    r.on('exit', function () {
        console.log('mem-cli closed. bye!');
        process.exit();
    });

    var help = {};
    help.decimal = '\n\r\t';
    help.get = 'get     <key>               get the value of a key ';
    help.set = 'set     <key> <expire>      set a key\'s value and expire time ';
    help.keys ='keys    <keyword>           find all keys matching the giving pattern';
    help.stats='stats   <keyword>           get information and server status';
    help.exit ='.exit                exit from this server';

    // 命令帮助文档
    r.defineCommand('mem-help', {
        help: help.decimal +help.get +
              help.decimal + help.set +
              help.decimal + help.keys +
              help.decimal + help.stats,
        action: function(name) {
            this.lineParser.reset();
            this.bufferedCommand = '';
            switch (name) {
                case "get":
                    console.log(help.get);
                    break;

                case "set":
                    console.log(help.set);
                    break;

                case "keys":
                    console.log(help.keys);
                    break;

                case "stats":
                    console.log(help.stats);
                    break;

                case "exit":
                    console.log(help.exit);
                    break;
            }
            this.displayPrompt();
        }
    });

    /**
     * 解析输入,执行memcache命令
     * @param cmd
     * @param context
     * @param filename
     * @param callback
     * @returns {boolean}
     */
    function execCmd(cmd, context, filename, callback) {
        if(this.connected == false) {
            console.log('Connection lost!');
            this.client.close();
            return false;
        }
        var cmdArr = cmd.split(' ');
        var key, value, lifetime, flags, unique;

        if(cmdArr.length < 1) {
            console.log("error command");
            r.prompt();
            return false;
        }
        // 去除最后一位末尾的\n
        cmdArr[cmdArr.length -1] = cmdArr[cmdArr.length -1].trim();

        if(cmdArr.length > 1){
            key = cmdArr[1];
        }
        if(cmdArr.length > 2){
            value = cmdArr[2];
        }
        if(cmdArr.length > 3){
            lifetime = cmdArr[3];
        }
        if(cmdArr.length > 4){
            flags = cmdArr[4];
        }

        switch (cmdArr[0]) {
            case "get":
                var keys = cmdArr.slice(1);
                var KeyNmu = keys.length;
                for(var i=0; i < KeyNmu; i++){
                    getData(keys[i], KeyNmu-i-1);
                }
                break;
            case "add":
            case "replace":
            case "append":
            case "prepend":
                if(empty(key) || empty(value)){
                    console.log("error command");
                    r.prompt();
                    return false;
                }
                // 这几条命令需要检查key是否已存在。
                memClient.get(key, function (error, result) {
                    if(!error) {
                        if(empty(result)){
                            console.log("NOT_STORED");
                            r.prompt();
                            return false;
                        }
                    } else {
                        console.log(error);
                        r.prompt();
                        return false;
                    }
                    setData(key, value, lifetime, flags)
                });
                break;
            case "set":
                if(empty(key) || empty(value)){
                    console.log("error command");
                    r.prompt();
                    return false;
                }
                setData(key, value, lifetime, flags)
                break;
            case "delete":
                var keys = cmdArr.slice(1);
                var KeyNmu = keys.length;
                for(var i=0; i < KeyNmu; i++){
                    delData(keys[i], KeyNmu-i-1);
                }
                break;
            case "cas":
                if(cmdArr.length > 3){
                    unique = cmdArr[3];
                }
                if(cmdArr.length > 4){
                    lifetime = cmdArr[4];
                }
                if(cmdArr.length > 5){
                    flags = cmdArr[5];
                }
                memClient.cas(key, value, unique, function (error, result) {
                    if(!error) {
                        console.log(result);
                    } else {
                        console.log(error);
                    }
                    r.prompt();
                },lifetime, flags);
                break;
            case "stats":
                if(!empty(key)) {
                    memClient.stats(key, function (error, result) {
                        if(!error) {
                            console.log(result);
                        } else {
                            console.log(error);
                        }
                        r.prompt();
                    });
                } else {
                    memClient.stats(function (error, result) {
                        if(!error) {
                            console.log(result);
                        } else {
                            console.log(error);
                        }
                        r.prompt();
                    });
                }
                break;
            case "version":
                memClient.version(function (error, result) {
                    if(!error) {
                        console.log(result);
                    } else {
                        console.log(error);
                    }
                    r.prompt();
                });
                break;
            case "flush_all":
                memClient.flush_all(function (error, result) {
                    if(!error) {
                        console.log(result);
                    } else {
                        console.log(error);
                    }
                    r.prompt();
                });
                break;
            case "gets":
                console.log("NO_SUPPORT");
                r.prompt();
                break;
            case "keys":
                getKeys(key);
                break;

            default :
                console.log("ERROR COMMAND");
                r.prompt();
                break;
        }
    }

    function getData(key, leftKeyNum) {
        memClient.get(key, function (error, result) {
            if(!error) {
                console.log(result);
            } else {
                console.log(error);
            }
            if(leftKeyNum <= 0) {
                r.prompt();
            }
        });
    }

    function delData(key, leftKeyNum) {
        memClient.delete(key, function (error, result) {
            if(!error) {
                console.log(result);
            } else {
                console.log(error);
            }
            if(leftKeyNum <= 0) {
                r.prompt();
            }
        });
    }

    function setData(key, value, lifetime, flags) {
        memClient.set(key, value, function (error, result) {
            if(!error) {
                console.log(result);
            } else {
                console.log(error);
            }
            r.prompt();
        }, lifetime, flags);
    }

     function getKeys(key) {

        memClient.stats('items', function (error, result) {
            if(!error) {
                if(!empty(result)){
                    var itemArr = [];
                    for(var i in result){
                        var tmpArr = i.split(':');
                        if(tmpArr.length > 1){
                            item = tmpArr[1];
                            if(!itemArr.inArray(item)){
                                itemArr.push(item);
                            }
                        }
                    }
                    getItems(key, itemArr);
                }
            } else {
                console.log(error);
            }
        })
    }

    function getItems(key, arr) {
        memClient.pattern = key;
        var keyArr = key.split('*');
        if(keyArr.length <= 1) {
            r.prompt();
            return false;
        }
        // 移除数组中的空字符串
        for(var j=0; j<keyArr.length; j++) {
            if(empty(keyArr[j])){
                keyArr.splice(j, 1);
                j--;
            }
        }

        var current = 0;

        for(var i=0; i<arr.length; i++){
            memClient.keys(arr[i], function (error, result) {
                if(error) {
                    return false;
                }
                // callback一次,次数加1
                current++;

                for(var item in result) {
                    var isPatch = true;
                    for(var j=0; j<keyArr.length; j++) {
                        var patch = (' '+item+' ').indexOf(keyArr[j]);
                        if(patch < 0){
                            isPatch = false;
                            break;
                        }
                    }
                    if(isPatch){
                        console.log('"' + item + '"');
                    }
                }

                if(current >= arr.length) {
                    r.prompt();
                }

            });
        }
    }

}


empty = function (obj) {
    return obj == undefined || obj == "" || obj == null;
}

Array.prototype.inArray = function (needle) {
    for(var i in this){
        if(this[i] == needle) {
            return true;
        }
    }
    return false;
}


