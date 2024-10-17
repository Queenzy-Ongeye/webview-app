const DB_NAME = "bleAppDB";
const DB_VERSION = 1;
const STORE_NAME = "bleDataStore";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create the object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Create an index on 'barcode' for lookups by barcode
        objectStore.createIndex("barcode", "barcode", { unique: true });
      } else {
        const objectStore = event.target.transaction.objectStore(STORE_NAME);

        // Ensure that the 'barcode' index exists
        if (!objectStore.indexNames.contains("barcode")) {
          objectStore.createIndex("barcode", "barcode", { unique: true });
        }
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

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
        reject(event.target.error);
      };
    });
  });
}

function getData(id) {
  if (typeof id === "undefined" || id === null) {
    return Promise.reject("Invalid key provided for getData");
  }

  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id); // Ensure 'id' is a valid key

      request.onsuccess = () => {
        if (request.result !== undefined) {
          resolve(request.result);
        } else {
          reject("No matching record found");
        }
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

function deleteData(id) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}
// Example IndexedDB utility for getting all data
const getAllData = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("myDatabase", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("products", "readonly");
      const store = transaction.objectStore("products");
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject("Failed to fetch data.");
    };

    request.onerror = () => reject("Failed to open database.");
  });
};

// Example IndexedDB utility for getting data by barcode
const getDataByBarcode = (barcode) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("myDatabase", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("products", "readonly");
      const store = transaction.objectStore("products");
      const getRequest = store.get(barcode);

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject("Failed to fetch product details.");
    };

    request.onerror = () => reject("Failed to open database.");
  });
};


export { addData, getData, getAllData, deleteData, getDataByBarcode };
