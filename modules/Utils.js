const Format = require("./types/Format");
const crypto = require('crypto');
const channelRegex = /(?:https|http):\/\/(?:[\w]+\.)?youtube\.com\/(?:c\/|channel\/|user\/)([a-zA-Z0-9-]{1,})/;

class Utils {

    static isYouTubeChannel(url) {
        return channelRegex.test(url);
    }

    static convertBytes(bytes) {
        const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let l = 0, n = parseInt(bytes, 10) || 0;
        while(n >= 1024 && ++l){
            n /= 1024;
        }
        return(n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
    }

    static convertBytesPerSecond(bytes) {
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s', 'EB/s', 'ZB/s', 'YB/s'];
        let l = 0, n = parseInt(bytes, 10);
        while(n >= 1024 && ++l) {
            n /= 1024;
        }
        return(n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
    }

    static numberFormatter(number, digits) {
        const def = [
            { value: 1, symbol: "" },
            { value: 1E3, symbol: "K" },
            { value: 1E6, symbol: "M" },
            { value: 1E9, symbol: "B" },
            { value: 1E12, symbol: "T" },
            { value: 1E15, symbol: "Q" },
            { value: 1E18, symbol: "Z" }
        ];
        let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        let i;
        for (i = def.length - 1; i > 0; i--) {
            if (number >= def[i].value) {
                break;
            }
        }
        return (number / def[i].value).toFixed(digits).replace(rx, "$1") + def[i].symbol;
    }

    static getRandomID(length) {
        return crypto.randomBytes(length / 2).toString("hex");
    }

    static extractPlaylistUrls(infoQueryResult) {
        let urls = [];
        let alreadyDone = [];
        if(infoQueryResult.entries == null || infoQueryResult.entries.length === 0) {
            console.error("Cannot extract URLS, no entries in data.")
            return [urls, alreadyDone];
        }
        for(const entry of infoQueryResult.entries) {
            let url;
            if (entry.url == null) url = entry.webpage_url;
            else url = (entry.ie_key != null && entry.ie_key === "Youtube") ? "https://youtube.com/watch?v=" + entry.url : entry.url;
            if(entry.formats != null && entry.formats.length > 0) {
                entry.url = url;
                alreadyDone.push(entry);
                continue;
            }
            urls.push(url);
        }
        return [urls, alreadyDone]
    }

    static detectInfoType(infoQueryResult) {
        if(Object.keys(infoQueryResult).length === 0) return false;
        if (infoQueryResult._type != null && infoQueryResult._type === "playlist") return "playlist";
        if (infoQueryResult.entries != null && infoQueryResult.entries > 0) return "playlist";
        return "single";
    }

    static hasFilesizes(metadata) {
        let filesizeDetected = false
        if(metadata.formats == null)  {
            console.error("No formats could be found.");
            return false;
        }
        for(const format of metadata.formats) {
            if(format.filesize != null) {
                filesizeDetected = true;
                break;
            }
        }
        return filesizeDetected
    }

    static parseAvailableFormats(metadata) {
        let formats = [];
        let detectedFormats = [];
        if(metadata.formats == null) {
            console.error("No formats could be found.")
            return [];
        }
        for(let dataFormat of metadata.formats) {
            if(dataFormat.height == null) continue;
            let format = new Format(dataFormat.height, dataFormat.fps, null, null);
            if(!detectedFormats.includes(format.getDisplayName())) {
                formats.push(format);
                detectedFormats.push(format.getDisplayName());
            }
        }
        return formats;
    }
}
module.exports = Utils;
