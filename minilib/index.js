/*--------------------------------------------------------------
 *  Copyright (c) general-programming. All rights reserved.
 *  Licensed under the MIT License.
 * 
 *  Authored by linuxgemini
 *-------------------------------------------------------------*/

"use strict";

const { NFC } = require("nfc-pcsc");
const EventEmitter = require("events");

class main extends EventEmitter {
    constructor() {
        super();
        this.__nfc = new NFC();
        this.currentReadHeads = {};
        this.currentReaders = [];
        this.currentCards = {};
        this.__initEvents();
    }

    __initEvents() {
        this.__nfc.on("reader", readHead => {

            readHead.autoProcessing = false;

            console.log(`[ ${readHead.reader.name} ] device attached`);

            this.currentReadHeads[readHead.reader.name] = readHead;
            this.currentReaders.push(readHead.reader);

            readHead.on("card", card => {
                console.log(`[ ${readHead.reader.name} ] card inserted`);
                this.currentCards[readHead.reader.name] = card;
                this.emit("newCard", readHead.reader.name);
            });
        
            readHead.on("card.off", card => {	
                console.log(`[ ${readHead.reader.name} ] card removed`);
                delete this.currentCards[readHead.reader.name];
            });
        
            readHead.on("error", err => {
                console.error(`[${readHead.reader.name} ] an error occurred`, err);
            });
        
            readHead.on("end", () => {
                console.log(`[ ${readHead.reader.name} ] device removed`);
                this.currentReadHeads = this.currentReadHeads.filter(rh => rh !== readHead);
                this.currentReaders = this.currentReaders.filter(r => r !== readHead.reader);
            });
        
        });
        
        this.__nfc.on("error", err => {
            console.error("[ NFClib ] an error occurred", err);
        });
    }
}

module.exports = main;