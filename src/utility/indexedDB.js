const DB_NAME = "bleAppDB";
const DB_VERSION = 1;
const STORE_NAME = "bleDataStore";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if(!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStoreName(STORE_NAME, { keyPath: "id", autoIncrement: true});

            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result)
        };

        request.onerror =(event) => {
            reject(event.target.error)
        };
    });
};

