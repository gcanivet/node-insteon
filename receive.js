/*
** Receive Functions
*/
var utils = require('./utils.js');
var config = require('./config.js');
var send = require('./send.js');
var insteon = require('./insteon.js');
var trans_queue = config.trans_queue;


/*
** handler: registered event handler for any data from serialport
*/
var handler = exports.handler = function handler(data) {
    console.log('handler::read serial hex: '+utils.byteArrayToHexStringArray(data));

    var insteonMsg = utils.insteonJS(data);
    console.log('handler::incoming insteon message:');
    console.log(insteonMsg);

    processMsg(insteonMsg);
};

/*
** processMsg: determine message type and handle message accordingly
*/
var processMsg = exports.processMsg = function processMsg(insteonMsg) {
    expired_count = 0; // message recd, reset expire counter

    // error handling
    if(insteonMsg.error) {
        console.log('processMsg::INSTEON message error ('+insteonMsg.error+')');
        //console.log(insteonMsg);
        if(insteonMsg.dec[0] == config.INSTEON_PLM_NAK) {
            if(!config.PLM_BUSY) {
                console.log('processMsg::PLM_BUSY detected; set PLM_BUSY for 3s');
                setTimeout(function(){ plm_wait(); }, 3000);
                config.PLM_BUSY = true;
            }
            if(config.auto_sync) {
                config.mode = 'queue_all';
                console.log('process::auto_sync set to queue_all mode');
            }
        }
        return;
    } else {
        if(config.auto_sync && config.mode != 'queue_device_msgs') {
            config.mode = 'queue_device_msgs';
            console.log('process::auto_sync returned to queue_device_msgs mode');
        }
    }
    // match sent messages to received messaged; complete transactions
    var matched = false;
    switch(insteonMsg.cmd) {
        case config.INSTEON_RECV_STANDARD:
            console.log('process::incoming INSTEON standard message');
            var flags = utils.getMessageFlagsByHex(insteonMsg.message_flags);
            if(flags.type == 'ACK of Direct Message') matched = match(insteonMsg);
            break;
        case config.INSTEON_RECV_EXTENDED:
            console.log('process::incoming INSTEON extended message');
            var flags = utils.getMessageFlagsByHex(insteonMsg.message_flags);
            if(flags.type == 'ACK of Direct Message') matched = match(insteonMsg);
            break;
        case config.INSTEON_RECV_X10: // do nothing
            console.log('process::incoming X10 message');
            break;
        default: // plm message
			console.log('process::incoming PLM message');
            matched = match(insteonMsg);
            break;
    }
    // unsolicited or unhandled messages
    if(!matched) {
        var date = new Date();
        var transaction = {
            id: date.getTime(),
            request: null,
            response: insteonMsg,
            state: 'INCOMING',
            cmd: insteonMsg.cmd,
        };
        config.eventEmitter.emit('message', transaction); // trigger new message event
    }

    process.nextTick(send.dequeue);
};

/*
** match: checking incoming message against the queue and update state accordingly
*/
var match = exports.match = function match(insteonMsg) {
    for(var i = trans_queue.length - 1; i >= 0; i--) {
        // INSTEON response - match inbound fromdeviceid to last PLM_ACK'd todeviceid; dequeue() ensures only 1 outbound msg to a given device at a time so this is safe
        if((insteonMsg.cmd == config.INSTEON_RECV_STANDARD || insteonMsg.cmd == config.INSTEON_RECV_EXTENDED)
          && trans_queue[i].type == 'INSTEON' && trans_queue[i].state == 'PLM_ACK') {
            var flags = utils.getMessageFlagsByHex(insteonMsg.message_flags);
            var toDeviceId = utils.byteArrayToHexStringArray(trans_queue[i].request.slice(2,5));
            if(flags.type == 'ACK of Direct Message' && utils.compareArray(insteonMsg.from, toDeviceId)) {
                    trans_queue[i].state = 'COMPLETE';
                    trans_queue[i].response = insteonMsg;
                    console.log('match::INSTEON transaction ('+trans_queue[i].id+') state updated to COMPLETE');
                    config.eventEmitter.emit('message', trans_queue[i]); // trigger complete transaction event
                    config.eventEmitter.emit('cleanup');
                    return true;
            }
        }
        // PLM response - match inbound INSTEON send SD or ED message against last sent message (echo)
        if(insteonMsg.cmd == config.INSTEON_SEND_STANDARD_OR_EXTENDED && insteonMsg.cmd == trans_queue[i].cmd
          && trans_queue[i].type == 'INSTEON' && trans_queue[i].state == 'SENT') {
            var partial = insteonMsg.dec.slice(0, insteonMsg.dec.length - 1); // remove last byte
            if(utils.compareArray(partial, trans_queue[i].request)) {
                var last_byte = insteonMsg.dec[insteonMsg.dec.length - 1];
                if(last_byte == config.INSTEON_PLM_ACK) {
                    trans_queue[i].state = 'PLM_ACK';
                    console.log('match::INSTEON transaction ('+trans_queue[i].id+') state updated to PLM_ACK');
                    //config.eventEmitter.emit('cleanup');
                    return true;
                } else if(last_byte == config.INSTEON_PLM_NAK) {
                    trans_queue[i].state = 'PLM_NAK'; // todo - or expired/failed?
                    console.log('match::INSTEON transaction ('+trans_queue[i].id+') state updated to PLM_NAK');
                    config.eventEmitter.emit('cleanup');
                    return true;
                }
            }
        }
        // PLM response - match inbound plm commands to last sent PLM command; if more than one exists, will match most recent
        if(insteonMsg.cmd == trans_queue[i].cmd && trans_queue[i].type == 'PLM' && trans_queue[i].state == 'SENT') {
            var last_byte = insteonMsg.dec[insteonMsg.dec.length - 1];
            if(last_byte == config.INSTEON_PLM_ACK) {
                trans_queue[i].state = 'COMPLETE'; // if plm command ack, then we are done
                trans_queue[i].response = insteonMsg;
                console.log('match::PLM transaction ('+trans_queue[i].id+') state updated to COMPLETE');
                config.eventEmitter.emit('message', trans_queue[i]);
                config.eventEmitter.emit('cleanup');
                return true;
            } else if(last_byte == config.INSTEON_PLM_NAK) {
                trans_queue[i].state = 'PLM_NAK';
                trans_queue[i].response = insteonMsg;
                console.log('match::PLM transaction ('+trans_queue[i].id+') state updated to PLM_NAK');
                config.eventEmitter.emit('message', trans_queue[i]);
                config.eventEmitter.emit('cleanup');
                return true;
            }
        }
    }
    // did not match anything in queue
    console.log('match::inbound message did not match anything in queue');
    return false;
}

/*
** plm_wait: reconnect and reset state after a plm_busy (nak) occurs
*/
var plm_wait = exports.plm_wait = function plm_wait() {
    // reconnect after PLM busy detected (handle buffer overrun)
    insteon.connect();
    config.PLM_BUSY = false;
    console.log('plm_wait::PLM no longer busy');
};

/*
** cleanup: removes items from the queue if they are no longer needed; called as an event or directly if immediate cleanup required
*/
var cleanup = exports.cleanup = function cleanup() {
    // remove items from the queue - make sure item is no longer needed!
    // TODO - does this actually clean object from memory or just remove reference to it in the queue?
    for(var i = trans_queue.length - 1; i >= 0; i--) {
        if(trans_queue[i].state == 'EXPIRED') {
            console.log('cleanup::removed EXPIRED message ('+trans_queue[i].id+')');
            var expired = trans_queue.splice(i,1)[0];
            expired = undefined;
            // io.sockets.json.emit('insteon', expired);
        } else if(trans_queue[i].state == 'PLM_NAK') {
            console.log('cleanup::removed PLM_NAK message ('+trans_queue[i].id+')');
            var failed = trans_queue.splice(i,1)[0];
            clearTimeout(failed.timerid);
            config.active_timers--;
            failed = undefined;
        } else if(trans_queue[i].state == 'COMPLETE') {
            console.log('cleanup::removed COMPLETE message ('+trans_queue[i].id+')');
            var complete = trans_queue.splice(i,1)[0];
            clearTimeout(complete.timerid);
            config.active_timers--;
            complete = undefined;
        }
    }
};
