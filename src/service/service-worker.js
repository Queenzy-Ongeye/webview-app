import { addData } from "../utility/indexedDB";

const CACHE_NAME = "ble-app-cache-v1";
const urlsToCache = [
    "/",
    "/public/index.html",
    "/src/App.css",
    "/src/App.js",
    "/src/Home.js",
    "/src/store.js",
    "/src/components/BleButtons/BleButtons.jsx",
    "/src/components/DeviceDetails/ATTPage.jsx",
    "/src/components/DeviceDetails/STSPage.jsx",
    "/src/components/DeviceDetails/CMDPage.jsx",
    "/src/components/DeviceDetails/DTAPage.jsx",
    "/src/components/DeviceDetails/DIAPage.jsx"
];

self.addEventListener("install", (event) =>{
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>{
            console.log("Opened cache");
            return cache.addAll(urlsToCache)
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) =>{
            if (response) {
                return response;
            }
            return fetch(event.request).then((response) =>{
                // Checking if response received is valid
                if(!response || response.status !== 200 || response.type !== "basic"){
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                // Store response data in IndexedDB if it's JSON
                if(response.headers.get("content-type").includes("application/json")){
                    response.clone().json().then((data) => {
                        // Saving data in the indexedDB
                        addData(data)
                    })
                }
                return response;
            });
        })
    );
});

self.addEventListener("activate", (event) => {
    const cacheWhiteList = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) =>{
            return Promise.all(
                cacheNames.map((cacheName) =>{
                    if(cacheWhiteList.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            )
        })
    )
})