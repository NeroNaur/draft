/* ARCH prototype: keeps uploaded PDFs in the browser (IndexedDB), because sessionStorage is too small.
   Files are tied to this tab's demo session: a fresh tab (empty sessionStorage) starts with no files,
   just like the rest of the demo data. Nothing is sent anywhere. */
(function () {
  var DB = "arch-files", STORE = "pdfs", TOKEN = "arch.fileSession";
  var MAX = 25 * 1048576;
  var session = null, dbp = null;

  try { session = sessionStorage.getItem(TOKEN); } catch (e) {}
  var fresh = !session;
  if (fresh) {
    session = "s" + Date.now() + Math.random().toString(36).slice(2, 8);
    try { sessionStorage.setItem(TOKEN, session); } catch (e) {}
  }

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error("IndexedDB not available"));
      var req = indexedDB.open(DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE, { keyPath: "key" }); };
      req.onsuccess = function () {
        var db = req.result;
        if (!fresh) return resolve(db);
        // New demo session: drop files left over from older sessions
        var tx = db.transaction(STORE, "readwrite"), st = tx.objectStore(STORE);
        st.openCursor().onsuccess = function (e) {
          var c = e.target.result; if (!c) return;
          if (c.value.session !== session) c.delete();
          c.continue();
        };
        tx.oncomplete = function () { resolve(db); };
        tx.onerror = function () { resolve(db); };
      };
      req.onerror = function () { reject(req.error); };
    });
    return dbp;
  }

  // Save a File; resolves to its key
  function put(file) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var key = "f" + Date.now() + Math.random().toString(36).slice(2, 7);
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put({ key: key, session: session, name: file.name, size: file.size, type: file.type, blob: file, saved: Date.now() });
        tx.oncomplete = function () { resolve(key); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  // Get { name, size, blob } or null
  function get(key) {
    if (!key) return Promise.resolve(null);
    return open().then(function (db) {
      return new Promise(function (resolve) {
        var req = db.transaction(STORE).objectStore(STORE).get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { resolve(null); };
      });
    }).catch(function () { return null; });
  }

  function isPdf(f) { return !!f && (/\.pdf$/i.test(f.name) || f.type === "application/pdf"); }

  window.ARCH_FILES = { put: put, get: get, isPdf: isPdf, MAX: MAX };
})();
