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

  // Check if the user is logged in
  const isLoggedIn = checkUserLogin();

  if (isLoggedIn) {
    // Fetch the user's budget data from the server
    fetchBudgetData();
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
      saveBudgetData(); // Save the budget data to the server
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
      expensesDescInput.value = "";
      expensesAmountInput.value = "";
      errorMessage.innerHTML = "";
    }
  });

  // Function to update budget summary
  function updateBudget() {
    budgetCard.textContent = budget.toFixed(2);
    // Update total expenses based on expensesList
    totalExpenses = expensesList.reduce((total, expense) => total + parseFloat(expense.amount), 0);
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
  function addExpenses(description, amount) {
    const userId = getUserId();
    const expense = { id: ++itemId, description, amount };

    fetch(`/api/expenses/${userId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(expense),
})

    .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        updateExpensesUI();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to update expenses UI for the current user
  function updateExpensesUI() {
    const userId = getUserId();
    fetchExpensesData(userId)
      .then((data) => {
        expensesList = data;
        renderExpenses();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to render expenses in the UI
  function renderExpenses() {
    tblRecord.innerHTML = "";
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
                <button type="button" class="btn-edit" data-id="${id}">Edit</button>
                <button type="button" class="btn-delete" data-id="${id}">Delete</button>
            </li>
        `;
    tblRecord.appendChild(li);
    totalExpenses += amount;
    expensesCard.textContent = totalExpenses.toFixed(2);
    updateBudget();

    const editButtons = li.querySelectorAll(".btn-edit");
    const deleteButtons = li.querySelectorAll(".btn-delete");

    editButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const expenseId = button.dataset.id;
        editExpense(expenseId);
      });
    });

    deleteButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const expenseId = button.dataset.id;
        deleteExpense(expenseId);
      });
    });
  }

  // Function to show error message
  function showError(message) {
    errorMessage.innerHTML = `<p>${message}</p>`;
  }

  // Function to save budget data to the server
  function saveBudgetData() {
    const userId = getUserId();
    const budgetData = {
      budget: budget,
      expenses: totalExpenses,
      balance: balance,
    };

    fetch(`/api/budget/${userId}`, {
      method: "PUT",
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
    const userId = getUserId();
    fetch(`/api/budget/${userId}`)
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
          updateExpensesUI();
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to fetch expenses data from the server
  function fetchExpensesData(userId) {
    return fetch(`/api/expenses/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch expenses data');
        }
        return response.json();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  // Function to delete an expense from the server
  function deleteExpense(expenseId) {
    const userId = getUserId();
    fetch(`/api/expenses/${userId}/${expenseId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        updateExpensesUI();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Function to edit an expense
  function editExpense(expenseId) {
    const userId = getUserId();
    const expenseIndex = expensesList.findIndex(
      (expense) => expense.id === parseInt(expenseId)
    );

    if (expenseIndex !== -1) {
      const expenseDesc = prompt(
        "Enter the new description:",
        expensesList[expenseIndex].description
      );
      const expenseAmount = parseFloat(
        prompt("Enter the new amount:", expensesList[expenseIndex].amount)
      );

      if (expenseDesc !== null && expenseAmount !== null) {
        const updatedExpense = {
          description: expenseDesc,
          amount: expenseAmount,
        };

        fetch(`/api/expenses/${userId}/${expenseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedExpense),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data.message);
            updateExpensesUI();
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    }
  }

  // Function to check if the user is logged in
  function checkUserLogin() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    return isLoggedIn === "true";
  }

  // Function to get the user ID from localStorage
  function getUserId() {
    return localStorage.getItem("userId");
  }

});


//function to handle user logout

const logoutUser = () => {
  
  //clear localStorage
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");

  //redirect user to login page

  window.location.href = "login.html";

};

document.getElementById('logoutBtn').addEventListener('click', logoutUser);
