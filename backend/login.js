const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnPopup = document.querySelector('.btnLogin-popup');
const iconClose = document.querySelector('.icon-close');

// Event listener for clicking on the "Register" link
registerLink.addEventListener('click', () => {
  wrapper.classList.add('active');
});

// Event listener for clicking on the "Login" link
loginLink.addEventListener('click', () => {
  wrapper.classList.remove('active');
});

// Event listener for clicking on the login button to open the login popup
btnPopup.addEventListener('click', () => {
  wrapper.classList.add('active-popup');
});

// Event listener for clicking on the close icon to close the popup
iconClose.addEventListener('click', () => {
  wrapper.classList.remove('active-popup');
});

// Function to handle user registration
const registerUser = async (username, email, password) => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    const data = await response.json();
    console.log(data);
   
    if (data.message === 'User registered successfully.') {
      // Clear the registration form
      document.getElementById('registerForm').reset();
         window.location.href = 'app.html';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while registering the user.');
  }
};

// Function to handle user login
const loginUser = async (email, password) => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    console.log(data);
    if (data.message === 'Login successful.') {
     
      // Store user session data in localStorage
      localStorage.setItem('isLoggedIn', true);
      localStorage.setItem('userId', data.user.id);
      // Redirect the user to the budget app page
      window.location.href = 'app.html';
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while logging in.');
  }
};

// Event listener for registration form submission
document.getElementById('registerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  registerUser(username, email, password);
});

// Event listener for login form submission
document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  loginUser(email, password);
});