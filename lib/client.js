/**
 * memcache操作
 * Created by Fandy on 2016/10/12.
 */
var memcache = require('./memcache')
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
    this.connect(memcacheConfig);
}

MemcacheClient.prototype.connect = function (config) {
    this.host = config.host || memcacheConfig.host;
    this.port = config.port || memcacheConfig.port;
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


