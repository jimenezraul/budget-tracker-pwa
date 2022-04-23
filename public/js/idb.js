let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;

  db.createObjectStore("new_budget", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadBudgetData();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

// save if there's no internet connection
function saveRecord(record) {
  const isDeposit = record.value > 0;
  const transaction = db.transaction(["new_budget"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget");

  budgetObjectStore.add(record);

  if (isDeposit) {
    alert("Your Deposit has been saved locally, it will be submitted automatically when you have an internet connection.");
  } else {
    alert("Your Expense has been saved locally, it will be submitted automatically when you have an internet connection.");
  }
}

function uploadBudgetData() {
  const transaction = db.transaction(["new_budget"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget");

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(["new_budget"], "readwrite");

          const budgetObjectStore = transaction.objectStore("new_budget");

          budgetObjectStore.clear();

          alert("All saved budgets has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener("online", uploadBudgetData);
