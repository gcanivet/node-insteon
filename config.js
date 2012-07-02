/*
** Configuration and Application Variables
*/
var events = require('events');

// insteon constants
exports.INSTEON_PLM_START = 0x02;
exports.INSTEON_PLM_ACK = 0x06;
exports.INSTEON_PLM_NAK = 0x15;
exports.INSTEON_PLM_TIME_LIMIT = 240;   // insteonParser(); all messages must complete in 240ms else discard

exports.INSTEON_SEND_STANDARD_OR_EXTENDED = 0x62;
exports.INSTEON_SEND_X10 = 0x63;
exports.INSTEON_RECV_STANDARD = 0x50;
exports.INSTEON_RECV_EXTENDED = 0x51;
exports.INSTEON_RECV_X10 = 0x52;

// system settings and state
exports.sp = null;								// serialport
exports.eventEmitter = new events.EventEmitter();
exports.INSTEON_QUEUE_LIMIT = 100;				// max allowed messages in queue
exports.INSTEON_PLM_TRANS_TIME_LIMIT = 1000;    // default transaction time limit
exports.INSTEON_DEFAULT_RETRIES = 1;			// default number of retries for enqueued messages
exports.active_timers = 0;						// number of active transactions with timers
exports.mode = 'queue_device_msgs'; 			// non_synchrounous | queue_all | queue_network_msgs | queue_device_msgs
exports.auto_sync = false;  					// upon PLM busy sets mode to queue_all and back; if retries happen before new messages then buffer will continue to overrun anyhow
exports.PLM_BUSY = false;						// set when plm busy (nak msg) detected
exports.expired_count = 0;						// number of transactions expired since last complete
exports.expired_count_reconnect = 4; 			// number of expirations allowed before a reconnect attempt
exports.trans_queue = [];
exports.discovery_mode = false;
exports.devices = [];

exports.INSTEON_MESSAGES = {
    // commands sent from an IM to Host
    '50' : {type: 'INSTEON Standard Message Received', len: 11},
    '51' : {type: 'INSTEON Extended Message Received', len: 25},
    '52' : {type: 'X10 Received', len: 4},
    '53' : {type: 'ALL-Linking Completed', len: 10},
    '54' : {type: 'Button Event Report', len: 3},
    '55' : {type: 'User Reset Detected', len: 2},
    '56' : {type: 'ALL-Link Cleanup Failure Report', len: 7},
    '57' : {type: 'ALL-Link Record Response', len: 10},
    '58' : {type: 'ALL-Link Cleanup Status Report', len: 3},
    // response from commands sent from Host to IM
    '60' : {type: 'Get IM Info', len: 9}, //
    '61' : {type: 'Send ALL-Link Command', len: 6},
    '62' : {type: 'Send INSTEON Standard or Extended Message'}, // no defined length [must check message flag]
    '63' : {type: 'Send X10', len: 5},
    '64' : {type: 'Start ALL-Linking', len: 5},
    '65' : {type: 'Cancel ALL-Linking', len: 3},
    '66' : {type: 'Set Host Device Category', len: 6},
    '67' : {type: 'Reset the IM', len: 3},
    '68' : {type: 'Set INSTEON ACK Message Byte', len: 4},
    '69' : {type: 'Get First ALL-Link Record', len: 3},
    '6a' : {type: 'Get Next ALL-Link Record', len: 3},
    '6b' : {type: 'Set IM Configuration', len: 4},
    '6c' : {type: 'Get ALL-Link Record for Sender', len: 3},
    '6d' : {type: 'LED On', len: 3},
    '6e' : {type: 'LED Off', len: 3},
    '6f' : {type: 'Manage ALL-Link Record', len: 12},
    '70' : {type: 'Set INSTEON NAK Message Byte', len: 4},
    '71' : {type: 'Set INSTEON ACK Message Two Bytes', len: 5},
    '72' : {type: 'RF Sleep', len: 3},
    '73' : {type: 'Get IM Configuration', len: 6}
};
