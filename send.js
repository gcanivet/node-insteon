/*
** Send Functions
*/
var utils = require('./utils.js');
var config = require('./config.js');
var receive = require('./receive.js');
var insteon = require('./insteon.js');
var trans_queue = config.trans_queue;

/*
** sendSerial: send a serial command, bypassing transaction queue
*/
var sendSerial = exports.sendSerial = function sendSerial(data) {
    //console.log('write serial dec: '+data);
    console.log('write serial hex: '+utils.byteArrayToHexStringArray(data));
    //io.sockets.send('write serial hex: '+utils.byteArrayToHexStringArray(data));
    var buf = new Buffer(data);
    config.sp.write(buf);
};

/*
** send: adds a serial command to the transaction queue
*/
var send = exports.send = function send(data, retry) {
    // pre: data is a byte array
    // adds message to back of queue
    if(data.length < 2) throw 'send::not a valid PLM message ('+data+'), must be greater than eq 2 bytes';
    if(data[1] < 0x60 || data[1] > 0x73) throw 'send::not a valid PLM message ('+data+'), command must be between 0x60 and 0x73';
    if(trans_queue.length == config.INSTEON_QUEUE_LIMIT) throw 'send::INSTEON_QUEUE_LIMIT reached on PLM message ('+data+')';
    if(data[1] == 0x63) throw 'send::X10 commands not supported at this time ('+data+')';
    if(retry == undefined) retry = config.INSTEON_DEFAULT_RETRIES;

    // type determines when transaction complete; plm messages only require plm ack/nak while INSTEON/X10 messages require plm ack/nak plus INSTEON/X10 ack/nak
    var cmd = data[1];
    var date = new Date();
    var tmstamp = date.getTime();

    var item = {
        id: tmstamp,
        request: data,
        state: 'QUEUED',
        retries_left: retry,
        cmd: cmd,
        timer: config.INSTEON_PLM_TRANS_TIME_LIMIT
    };
    if(cmd == config.INSTEON_SEND_STANDARD_OR_EXTENDED) {
        item.type = 'INSTEON';
        item.to_address = utils.dec2hexstr(data[2]) + utils.dec2hexstr(data[3]) + utils.dec2hexstr(data[4]);
        var message_flags = utils.getMessageFlags(data[5]);
        item.timer = utils.getInsteonTimer(message_flags.extended, message_flags.max_hops, 1);
        // todo - determine if message has ack or nak response to improve timer, for now assume ack (true) in last parameter
    } else if(cmd == config.INSTEON_SEND_X10) {
        item.type = 'X10';
    } else {
        item.type = 'PLM';
        item.timer = utils.getPlmTimer(cmd);
    }
    trans_queue.unshift(item);
    console.log('send::added message ('+item.id+') ('+utils.byteArrayToHexStringArray(data)+') (retries_left:'+item.retries_left+') to front of queue (length:'+trans_queue.length+')');
    dequeue(); // run immediately instead of evented; command on the wire sooner, for the most common case
};

/*
** dequeue: execute next appopropriate serial command(s) from the queue; not always FIFO; does not actually remove it, cleanup() does that later
*/
var dequeue = exports.dequeue = function dequeue() {
	if(config.PLM_BUSY) return;
    // process next
    switch(config.mode) {
        case 'non_synchronous':
            // send messages immediately (no waiting)
            for(var i = trans_queue.length-1; i >= 0; i--) {
                if(trans_queue[i].state == 'QUEUED') {
                    sendSerial(trans_queue[i].request);
                    trans_queue[i].state = 'SENT';
                    (function(item) {
                        config.active_timers++;
                        item.timerid = setTimeout(function(){timer(item)}, item.timer);
                    })(trans_queue[i]);
                }
            }
            break;
        case 'queue_all':
            // send last message
            if(trans_queue.length > 0) {
                var item = trans_queue[trans_queue.length-1];
                if(item.state == 'QUEUED') {
                    sendSerial(item.request);
                    item.state = 'SENT';
                    (function(item) {
                        config.active_timers++;
                        item.timerid = setTimeout(function(){timer(item)}, item.timer);
                    })(item);
                }
            }
            break;
        case 'queue_network_msgs':
            for(var i = trans_queue.length-1; i >= 0; i--) {
                if(trans_queue[i].type == 'PLM') {
                    // send all PLM
                    if(trans_queue[i].state == 'QUEUED') {
                        sendSerial(trans_queue[i].request);
                        trans_queue[i].state = 'SENT';
                        (function(item) {
                            config.active_timers++;
                            item.timerid = setTimeout(function(){timer(item)}, item.timer);
                        })(trans_queue[i]);
                    }
                } else {
                    // send last network message if and only if queued
                    var last_network_msg = trans_queue[i];
                    if(last_network_msg.state == 'QUEUED') {
                        sendSerial(last_network_msg.request);
                        last_network_msg.state = 'SENT';
                        (function(item) {
                            config.active_timers++;
                            item.timerid = setTimeout(function(){timer(item)}, item.timer);
                        })(last_network_msg);
                    }
                }
            }
            break;
        case 'queue_device_msgs':
            var busy_devices = {}; // key-value pairs
            for(var i = trans_queue.length-1; i >= 0; i--) {
                if(trans_queue[i].type == 'PLM') {
                    // send all PLM
                    if(trans_queue[i].state == 'QUEUED') {
                        sendSerial(trans_queue[i].request);
                        trans_queue[i].state = 'SENT';
                        (function(item) {
                            config.active_timers++;
                            item.timerid = setTimeout(function(){timer(item);}, item.timer);
                        })(trans_queue[i]); // pass static reference to queued object
                    }
                } else {
					// send network message as long as target device not busy
                    var to = trans_queue[i].to_address;
                    if(trans_queue[i].state != 'QUEUED') busy_devices[to] = true;
                    if(trans_queue[i].state == 'QUEUED' && (busy_devices[to] == false || busy_devices[to] == undefined)) {
                        console.log('dequeue::releasing message ('+trans_queue[i].id+'), check back in '+trans_queue[i].timer+'ms');
                        sendSerial(trans_queue[i].request);
                        trans_queue[i].state = 'SENT';
                        (function(item) {
                            config.active_timers++;
                             item.timerid = setTimeout(function(){timer(item);}, item.timer); // like passing by value; new scope so item is not changed by parent scope
                        })(trans_queue[i]);
                        busy_devices[to] = true;
                    }
                }
            }
            break;
        default:
            throw 'dequeue::mode not supported';
    }
};

/*
** timer: handle any expired transactions
*/
var timer = exports.timer = function(trans_queue_item, messageid) {
    console.log('timer::message ('+trans_queue_item.id+') timer executing');
    if(trans_queue_item == undefined) return;
    config.active_timers--;
    if(trans_queue_item.state != 'COMPLETE') {
        trans_queue_item.prev_state = trans_queue_item.state;
        trans_queue_item.state = 'EXPIRED';
        console.log('timer::messsage ('+trans_queue_item.id+') state updated to EXPIRED');
        receive.cleanup(); // run immediately instead of evented; instead of waiting for next cleanup then next dequeue event, creating a delay
        // recconnect check
        expired_count++;
        if(expired_count > expired_count_reconnect) {
            console.log('timer::consecutive expired messages exceeds '+expired_count_reconnect+', attempting reconnect');
            insteon.connect();
        }
        // retry expired messages, add to back of queue (not front, based on heuristics)
        if(trans_queue_item.retries_left > 0) {
            send(trans_queue_item.request, trans_queue_item.retries_left - 1); //
        }
    }
};
