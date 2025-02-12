const fs = require('fs');

const savedatPath = "save.dat";

class Decoder {
    constructor(path) {
        this.Values = [
            "tankid_name", "Token"
        ];
        this.pType = [2, 4, 5, 5]; 
        this.rawBytes = Buffer.alloc(0);
        this.pChars = "";
        this.Positions = [];
        this.PositionLength = [];

        this.openFile(path);
    }

    openFile(path) {
        try {
            this.rawBytes = fs.readFileSync(path);
            this.pChars = this.rawBytes.toString("latin1");
            }
            finally {
        console.log("decoding save dat");
    }
    }
    

    validateChar(char) {
        const code = char.charCodeAt(0);
        return (
            (code >= 0x40 && code <= 0x5A) ||  
            (code >= 0x61 && code <= 0x7A) ||  
            (code >= 0x30 && code <= 0x39) ||  
            (code >= 0x2B && code <= 0x2E)     
        );
    }

    decodeFile() {
        if (!this.pChars || !this.pChars.includes("Token")) {
            return { Error: "token nooot found" };
        }

        const result = {};
        this.Values.forEach((value, index) => {
            const start = this.pChars.indexOf(value);
            if (start !== -1) {
                result[value] = this.extractValue(index, start);
            }
        });

        return result;
    }

    extractValue(index, pos) {
        switch (this.pType[index]) {
            case 2: { // String
                let length = this.pChars.charCodeAt(pos + this.Values[index].length);
                return this.pChars.slice(pos + this.Values[index].length + 4, pos + this.Values[index].length + 4 + length);
            }
            case 4: { // Token
                return this.findToken() || "Token not found";
            }
            default:
                return null;
        }
    }

    findToken() {
        let tokenMarker = Buffer.from("Token", "latin1");
        let pos = this.rawBytes.indexOf(tokenMarker);
        if (pos === -1) return null;

        pos += tokenMarker.length;
        while (pos < this.rawBytes.length && !this.isBase64Char(this.rawBytes[pos])) pos++;
        let startPos = pos;

        while (pos < this.rawBytes.length && this.isBase64Char(this.rawBytes[pos])) pos++;
        return this.rawBytes.slice(startPos, pos).toString("latin1");
    }

    isBase64Char(byte) {
        return (
            (byte >= 65 && byte <= 90) ||  
            (byte >= 97 && byte <= 122) || 
            (byte >= 48 && byte <= 57) ||  
            byte === 43 || byte === 47 || byte === 61 
        );
    }
}


const decoder = new Decoder(savedatPath);
const decodedContent = decoder.decodeFile();
fs.writeFileSync("save.json", JSON.stringify(decodedContent, null, 4), "utf8");
