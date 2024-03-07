"use strict";

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

  let budget = 0;
  let totalExpenses = 0;
  let balance = 0;
  let itemId = 0;
  let expensesList = []; // Array to store all expenses

  // Event listener for budget calculation
  budgetForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const budgetValue = parseFloat(budgetInput.value);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      showError("Please enter a valid budget amount.");
    } else {
      budget = budgetValue;
      updateBudget();
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
    balance = budget - totalExpenses;
    balanceCard.textContent = balance.toFixed(2);
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
      }
    });

    // Delete button event listener
    deleteButton.addEventListener("click", function () {
      const index = expensesList.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        expensesList.splice(index, 1);

        tblRecord.removeChild(li);

        totalExpenses -= parseFloat(
          li.children[2].textContent.replace("$", "")
        );
        expensesCard.textContent = totalExpenses.toFixed(2);

        balance = budget - totalExpenses;
        balanceCard.textContent = balance.toFixed(2);
      }
    });
  }

  // Function to add expenses
  function addExpenses(description, amount) {
    const li = document.createElement("li");
    li.innerHTML = `
            <li>${++itemId}</li>
            <li>${description}</li>
            <li>$${amount.toFixed(2)}</li>
            <li>
                <button type="button" class="btn_edit">Edit</button>
                <button type="button" class="btn_delete">Delete</button>
            </li>
        `;
    tblRecord.appendChild(li);
    totalExpenses += amount;
    expensesCard.textContent = totalExpenses.toFixed(2);
    updateBudget();
    // Add expense to the list
    expensesList.push({ id: itemId, description: description, amount: amount });
    // Add event listeners to edit and delete buttons
    addEventListenersToButtons(li, itemId);
  }

  // Function to show error message
  function showError(message) {
    errorMessage.innerHTML = `<p>${message}</p>`;
  }
});
