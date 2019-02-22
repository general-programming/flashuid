/*--------------------------------------------------------------
 *  Copyright (c) general-programming. All rights reserved.
 *  Licensed under the MIT License.
 * 
 *  Authored by linuxgemini
 *-------------------------------------------------------------*/

"use strict";

try {
    var config = require("./config.js");
    var flashFullblock;
    if (!config.flashFullSectorZeroBlockZero) {
        var targetUID = config.shortUID; 
        flashFullblock = false;
    } else {
        var targetFullBlock = config.fullSectorZeroBlockZero;
        flashFullblock = true;
    }
} catch (error) {
    console.error("Config doesn't exist! Please make one based from the config.example.js file.");
    process.exit(1);
}

const lib = require("./minilib/index");


const requestUID = Buffer.from("FFCA000000", "hex");

const commandOne = Buffer.from("FF00000008D408630200630300", "hex");
const responseOne = Buffer.from("D5099000", "hex");

const commandTwo = Buffer.from("FF00000006D442500057CD", "hex");
const responseTwo = Buffer.from("D543019000", "hex");

const commandThree = Buffer.from("FF00000005D408633D07", "hex");
const responseThree = Buffer.from("D5099000", "hex");

const commandFour = Buffer.from("FF00000003D44240", "hex");
const responseFour = Buffer.from("D543000A9000", "hex");

const commandFive = Buffer.from("FF00000005D408633D00", "hex");
const responseFive = Buffer.from("D5099000", "hex");

const commandSix = Buffer.from("FF00000003D44243", "hex");
const responseSix = Buffer.from("D543000A9000", "hex");

const commandSeven = Buffer.from("FF00000008D408630280630380", "hex");
const responseSeven = Buffer.from("D5099000", "hex");

const getSectorZeroBlockZero = Buffer.from("FF00000005D440013000", "hex");

try {
    var key = "";
    if (flashFullblock) {
        if (targetFullBlock.length !== 32) throw new Error("Sector 0 Block 0 should be 16 bytes.");

        var targetFullBlockUpperCase = targetFullBlock.toUpperCase();

        var buf = Buffer.from(targetFullBlockUpperCase, "hex");
        if (!buf || buf.length !== 16) throw new Error("Key buffer is empty or not in correct length! Probably because of invalid characters in input. Make sure that you have 16 bytes (32 characters).");

        var bcc = (buf[0] ^ buf[1] ^ buf[2] ^ buf[3]).toString(16).toUpperCase();
        if (bcc.length === 1) bcc = `0${bcc}`;

        var writtenBcc = buf[4].toString(16).toUpperCase();
        if (writtenBcc.length === 1) writtenBcc = `0${writtenBcc}`;

        if (bcc !== writtenBcc) throw new Error("BCC is not correct.");

        var controlValue1 = buf[5].toString(16).toUpperCase();
        if (controlValue1.length === 1) controlValue1 = `0${controlValue1}`;
        var controlValue2 = buf[6].toString(16).toUpperCase();
        if (controlValue2.length === 1) controlValue2 = `0${controlValue2}`;
        var controlValue3 = buf[7].toString(16).toUpperCase();
        if (controlValue3.length === 1) controlValue3 = `0${controlValue3}`;

        var controlValue = `${controlValue1}${controlValue2}${controlValue3}`;
        if (controlValue !== "080400" && controlValue !== "880400") throw new Error("SAK and ATQA value check error.");

        key = targetFullBlockUpperCase;
    } else {
        if (targetUID.length !== 8) throw new Error("Target UID must be 4 bytes.");

        var targetUIDUpperCase = targetUID.toUpperCase();
    
        var buf2 = Buffer.from(targetUIDUpperCase, "hex");
        if (!buf2 || buf2.length !== 4) throw new Error("UID buffer is empty or not in correct length! Probably because of invalid characters in input. Make sure that you have 4 bytes (8 characters).");

        var bcc2 = (buf2[0] ^ buf2[1] ^ buf2[2] ^ buf2[3]).toString(16).toUpperCase();
        if (bcc2.length === 1) bcc2 = `0${bcc2}`;

        key = "WAITFORCARDREAD";
    }
} catch (error) {
    console.error(error.stack);
    process.exit(1);
}

const setUID = () => {
    return Buffer.from(`FF00000015D44001A000${key}`, "hex");
};
const setUIDResponse = Buffer.from("D541009000", "hex");

const nfcMiniLib = new lib();

const convertBufToHexStr = (m) => {
    return m.toString("hex").toUpperCase();
};

const readUID = (readerName) => {
    return new Promise(async (resolve, reject) => {
        try {
            let reader = nfcMiniLib.currentReadHeads[readerName];

            // eslint-disable-next-line no-unused-vars
            let cont = await reader.transmit(requestUID, 6);

            let b = await reader.transmit(commandOne, responseOne.length);
            if (convertBufToHexStr(b) !== convertBufToHexStr(responseOne)) throw new Error("Command fuckup");
        
            let c = await reader.transmit(commandTwo, responseTwo.length);
            if (convertBufToHexStr(c) !== convertBufToHexStr(responseTwo)) throw new Error("Command fuckup");
        
            let d = await reader.transmit(commandThree, responseThree.length);
            if (convertBufToHexStr(d) !== convertBufToHexStr(responseThree)) throw new Error("Command fuckup");
        
            let e = await reader.transmit(commandFour, responseFour.length);
            if (convertBufToHexStr(e) !== convertBufToHexStr(responseFour)) throw new Error("Command fuckup");
        
            let f = await reader.transmit(commandFive, responseFive.length);
            if (convertBufToHexStr(f) !== convertBufToHexStr(responseFive)) throw new Error("Command fuckup");
        
            let g = await reader.transmit(commandSix, responseSix.length);
            if (convertBufToHexStr(g) !== convertBufToHexStr(responseSix)) throw new Error("Command fuckup");
        
            let h = await reader.transmit(commandSeven, responseSeven.length);
            if (convertBufToHexStr(h) !== convertBufToHexStr(responseSeven)) throw new Error("Command fuckup");
        
            let sectorZeroBlockZero = await reader.transmit(getSectorZeroBlockZero, 21);
            let hexbs = convertBufToHexStr(sectorZeroBlockZero).match(/.{1,2}/g);
            let status = hexbs.slice(-2).join("");
            if (status !== "9000")  throw new Error("Command fuckup");
            let szbz = hexbs.slice(3).slice(0,-2).join("");

            resolve(szbz);
        } catch (error) {
            reject(error);
        }
    });
};

const writeUID = (readerName) => {
    return new Promise(async (resolve, reject) => {
        try {
            let reader = nfcMiniLib.currentReadHeads[readerName];

            let cont = await reader.transmit(requestUID, 6);
            if (!flashFullblock) {
                console.log(`[ UID Writer ] WRITE IN PROGRESS, Current UID is ${cont.slice(0,-2).toString("hex").toUpperCase()}`);
            } else {
                console.log("[ UID Writer ] WRITE IN PROGRESS");
            }

            let b = await reader.transmit(commandOne, responseOne.length);
            if (convertBufToHexStr(b) !== convertBufToHexStr(responseOne)) throw new Error("Command fuckup");
        
            let c = await reader.transmit(commandTwo, responseTwo.length);
            if (convertBufToHexStr(c) !== convertBufToHexStr(responseTwo)) throw new Error("Command fuckup");
        
            let d = await reader.transmit(commandThree, responseThree.length);
            if (convertBufToHexStr(d) !== convertBufToHexStr(responseThree)) throw new Error("Command fuckup");
        
            let e = await reader.transmit(commandFour, responseFour.length);
            if (convertBufToHexStr(e) !== convertBufToHexStr(responseFour)) throw new Error("Command fuckup");
        
            let f = await reader.transmit(commandFive, responseFive.length);
            if (convertBufToHexStr(f) !== convertBufToHexStr(responseFive)) throw new Error("Command fuckup");
        
            let g = await reader.transmit(commandSix, responseSix.length);
            if (convertBufToHexStr(g) !== convertBufToHexStr(responseSix)) throw new Error("Command fuckup");
        
            let h = await reader.transmit(commandSeven, responseSeven.length);
            if (convertBufToHexStr(h) !== convertBufToHexStr(responseSeven)) throw new Error("Command fuckup");
        
            let setc = await reader.transmit(setUID(), setUIDResponse.length);
            if (convertBufToHexStr(setc) !== convertBufToHexStr(setUIDResponse)) throw new Error("Command fuckup, big one.");

            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
};

nfcMiniLib.on("newCard", async (readerName) => {
    try {
        let atrBlocks = nfcMiniLib.currentCards[readerName].atr.toString("hex").toUpperCase().match(/.{1,2}/g);
        let mfcCheckPoint = `${atrBlocks[13]}${atrBlocks[14]}`;
        if (mfcCheckPoint !== "0001") throw new Error("Card is possibly not a MIFARE Classic");

        let sectorZeroBlockZeroHEXStr = await readUID(readerName);
        console.log(`[ UID Writer ] HOLD THE CARD, Current UID block is ${sectorZeroBlockZeroHEXStr}`);

        if (key === "WAITFORCARDREAD") key = `${targetUIDUpperCase}${bcc2}${sectorZeroBlockZeroHEXStr.slice(10)}`;

        await writeUID(readerName);
        if (!flashFullblock) {
            console.log(`[ UID Writer ] SAFE TO REMOVE, UID is now ${targetUID}`);
        } else {
            console.log(`[ UID Writer ] SAFE TO REMOVE, UID block is now ${targetFullBlock}`);
        }
        
    } catch (error) {
        console.error(error.stack);
    }
});