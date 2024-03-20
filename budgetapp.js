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

  let budget = parseFloat(localStorage.getItem("budget")) || 0;
  let totalExpenses = parseFloat(localStorage.getItem("totalExpenses")) || 0;
  let balance = parseFloat(localStorage.getItem("balance")) || 0;
  let itemId = parseInt(localStorage.getItem("itemId")) || 0;
  let expensesList = JSON.parse(localStorage.getItem("expensesList")) || [];
  let selectedCurrency = localStorage.getItem("selectedCurrency") || "USD";

  // Check if the user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");

  if (isLoggedIn) {
    // Fetch the user's budget data from the server
    fetchBudgetData();
  } else {
    // Redirect the user to the login page
    window.location.href = "/login.html";
  }

  // Populate expenses list on page load
  expensesList.forEach((expense) => {
    addExpensesToUI(expense.description, expense.amount, expense.id);
  });

  // Event listener for currency selection
  currencySelect.addEventListener("change", function () {
    selectedCurrency = currencySelect.value;
    updateCurrencySymbols();
    updateBudget();
    saveToLocalStorage();
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
      saveBudgetData(); // Save the budget data to the server
      saveToLocalStorage();
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
      addExpenses(expensesDesc, expensesAmount);
      saveBudgetData(); // Save the budget data to the server
      saveToLocalStorage();
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

  // Function to add event listeners to edit and delete buttons
  function addEventListenersToButtons(li, itemId) {
    const editButton = li.querySelector(".btn_edit");
    const deleteButton = li.querySelector(".btn_delete");

    // Edit button event listener
    editButton.addEventListener("click", function () {
      const expense = expensesList.find((item) => item.id === itemId);
      if (expense) {
        expensesDescInput.value = expense.description;
        expensesAmountInput.value = expense.amount;

        expensesList = expensesList.filter((item) => item.id !== itemId);

        tblRecord.removeChild(li);

        totalExpenses -= expense.amount;
        expensesCard.textContent = totalExpenses.toFixed(2);

        balance = budget - totalExpenses;
        balanceCard.textContent = balance.toFixed(2);

        saveBudgetData(); // Save the updated budget data to the server
        saveToLocalStorage();
      }
    });

    // Delete button event listener
    deleteButton.addEventListener("click", function () {
      const index = expensesList.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        expensesList.splice(index, 1); // Remove the expense from the expensesList

        tblRecord.removeChild(li);

        totalExpenses -= parseFloat(
          li.children[2].textContent.replace(/[\$KSh]/g, "")
        );
        expensesCard.textContent = totalExpenses.toFixed(2);

        balance = budget - totalExpenses;
        balanceCard.textContent = balance.toFixed(2);

        deleteExpenseFromServer(itemId); // Delete the expense from the server
        saveBudgetData(); // Save the updated budget data to the server
        saveToLocalStorage(); // Save the updated data to localStorage
      }
    });
  }

  // Function to add expenses
  function addExpenses(description, amount) {
    const userId = localStorage.getItem("userId");

    fetch("http://localhost:3000/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, description, amount }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    addExpensesToUI(description, amount, ++itemId);
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
    expensesList.push({ id, description, amount });
    addEventListenersToButtons(li, id);
  }

  // Function to show error message
  function showError(message) {
    errorMessage.innerHTML = `<p>${message}</p>`;
  }

  // Function to save budget data to the server
  function saveBudgetData() {
    const userId = localStorage.getItem("userId");
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
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to fetch budget data from the server
  function fetchBudgetData() {
    fetch("http://localhost:3000/budget")
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

  // Function to delete an expense from the server
  function deleteExpenseFromServer(expenseId) {
    fetch(`http://localhost:3000/expenses/${expenseId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to save data to localStorage
  function saveToLocalStorage() {
    localStorage.setItem("budget", budget);
    localStorage.setItem("totalExpenses", totalExpenses);
    localStorage.setItem("balance", balance);
    localStorage.setItem("itemId", itemId);
    localStorage.setItem("expensesList", JSON.stringify(expensesList));
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }
});