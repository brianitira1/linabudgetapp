document.addEventListener("DOMContentLoaded", function () {
  const budgetInput = document.getElementById("budget-input");
  const expensesDescInput = document.getElementById("expenses-desc");
  const expensesAmountInput = document.getElementById("expenses-amount");
  const budgetForm = document.getElementById("budget-form");
  const expensesForm = document.getElementById("expenses-form");
  const errorMessage = document.querySelector(".error_message");
  const budgetCard = document.querySelector(".budget_card");
  const expensesCard = document.querySelector(".expenses_card");
  const balanceCard = document.querySelector(".balance_card");
  const tblRecord = document.querySelector(".tbl_tr_content");
  const currencySelect = document.getElementById("currency-select");
  const budgetCurrencySpan = document.getElementById("budget-currency");
  const expensesCurrencySpan = document.getElementById("expenses-currency");
  const balanceCurrencySpan = document.getElementById("balance-currency");

  let budget = 0;
  let totalExpenses = 0;
  let balance = 0;
  let itemId = 0;
  let expensesList = [];
  let selectedCurrency = "USD";
  const userId = session.userId; // You need to replace this with the actual user ID from your authentication system

  // Check if the user is logged in
  const isLoggedIn = true; // You need to replace this with your actual login check

  if (isLoggedIn) {
    // Fetch the user's budget data from the server
    fetchBudgetData(userId);
  } else {
    // Redirect the user to the login page
    window.location.href = "/login.html";
  }

  // Event listener for currency selection
  currencySelect.addEventListener("change", function () {
    selectedCurrency = currencySelect.value;
    updateCurrencySymbols();
    updateBudget();
  });

  // Event listener for budget calculation
  budgetForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const budgetValue = parseFloat(budgetInput.value);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      showError("Please enter a valid budget amount.");
    } else {
      budget = budgetValue;
      updateBudget();
      saveBudgetData(userId); // Save the budget data to the server
      budgetInput.value = "";
      errorMessage.innerHTML = "";
    }
  });

  // Event listener for adding expenses
  expensesForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const expensesDesc = expensesDescInput.value.trim();
    const expensesAmount = parseFloat(expensesAmountInput.value);
    if (expensesDesc === "" || isNaN(expensesAmount) || expensesAmount <= 0) {
      showError("Please enter a valid expenses description and amount.");
    } else {
      addExpenses(userId, expensesDesc, expensesAmount);
      expensesDescInput.value = "";
      expensesAmountInput.value = "";
      errorMessage.innerHTML = "";
    }
  });

  // Function to update budget summary
  function updateBudget() {
    budgetCard.textContent = budget.toFixed(2);
    expensesCard.textContent = totalExpenses.toFixed(2);
    balance = budget - totalExpenses;
    balanceCard.textContent = balance.toFixed(2);
  }

  // Function to update currency symbols
  function updateCurrencySymbols() {
    if (selectedCurrency === "USD") {
      budgetCurrencySpan.textContent = "$";
      expensesCurrencySpan.textContent = "$";
      balanceCurrencySpan.textContent = "$";
    } else if (selectedCurrency === "KSH") {
      budgetCurrencySpan.textContent = "KSh";
      expensesCurrencySpan.textContent = "KSh";
      balanceCurrencySpan.textContent = "KSh";
    }
  }

  // Function to add expenses
  function addExpenses(userId, description, amount) {
    const expense = { id: ++itemId, description, amount, userId };

    fetch("http://localhost:3000/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expense),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        // Update UI or perform any necessary actions after adding expenses
        // For example, you can call a function to update the UI here
        updateExpensesUI();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to update
  // Function to update expenses UI for the current user
  function updateExpensesUI() {
    // You can fetch the latest expenses data from the server and update the UI accordingly
    // For example:
    fetchExpensesData(userId)
      .then((data) => {
        // Update expensesList with the latest data from the server
        expensesList = data;
        // Update UI to display the updated expensesList
        renderExpenses();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to render expenses in the UI
  function renderExpenses() {
    // Clear existing expenses UI
    tblRecord.innerHTML = "";
    // Render expensesList in the UI
    expensesList.forEach((expense) => {
      addExpensesToUI(expense.description, expense.amount, expense.id);
    });
  }

  // Function to add expenses to the UI
  function addExpensesToUI(description, amount, id) {
    const li = document.createElement("li");
    li.innerHTML = `
            <li>${id}</li>
            <li>${description}</li>
            <li>${selectedCurrency === "USD" ? "$" : "KSh"}${amount.toFixed(2)}</li>
            <li>
                <button type="button" class="btn_edit">Edit</button>
                <button type="button" class="btn_delete">Delete</button>
            </li>
        `;
    tblRecord.appendChild(li);
    totalExpenses += amount;
    expensesCard.textContent = totalExpenses.toFixed(2);
    updateBudget();
  }

  // Function to show error message
  function showError(message) {
    errorMessage.innerHTML = `<p>${message}</p>`;
  }

  // Function to save budget data to the server
  function saveBudgetData(userId) {
    const budgetData = {
      userId: userId,
      budget: budget,
      expenses: totalExpenses,
      balance: balance,
    };

    fetch("http://localhost:3000/budget", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(budgetData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        // Handle response if needed
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to fetch budget data from the server
  function fetchBudgetData(userId) {
    fetch("http://localhost:3000/budget/" + userId)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
        } else {
          budget = data.budget;
          totalExpenses = data.expenses;
          balance = data.balance;
          updateBudget();
          updateCurrencySymbols();
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to fetch expenses data from the server
  function fetchExpensesData(userId) {
    return fetch("http://localhost:3000/expenses/" + userId)
      .then((response) => response.json())
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to delete an expense from the server
  function deleteExpenseFromServer(expenseId) {
    fetch(`http://localhost:3000/expenses/${expenseId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        // Handle response if needed
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Other functions like addEventListenersToButtons can be modified similarly

  // Make sure to remove any remaining localStorage-related code
});
