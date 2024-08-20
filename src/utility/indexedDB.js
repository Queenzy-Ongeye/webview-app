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

function addData(data) {
    return openDB().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                reject(event.target.erro)
            };

        });
    });
};

function getData(id) {
    return openDB().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.objectStore(STORE_NAME);

            request.onsuccess = () =>{
                resolve(request.result);
            };

            request.onerror = (event) => {
                reject(event.target.error)
            };
        });
    });
};

function getAllData(){
    return openDB().then((db) =>{
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.objectStore(STORE_NAME);
            
            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
};



