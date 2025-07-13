import "react-native-get-random-values";
import "@ethersproject/shims";
import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";
import { Buffer } from "buffer";
global.Buffer = Buffer;

class Crypto {
    getRandomValues = expoCryptoGetRandomValues;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new Crypto();

(() => {
    if (typeof crypto === "undefined") {
        Object.defineProperty(window, "crypto", {
            configurable: true,
            enumerable: true,
            get: () => webCrypto,
        });
    }
})();

// Then import the expo router
import "expo-router/entry";
