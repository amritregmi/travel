import '@babel/polyfill' // makes es6 feature compatible 
import { displayMap } from './mapbox'
import { login, logout, signup } from './login'
import { updateSettings } from './updateSettings'
import { bookTour } from './sripe'
import { showAlert } from './alerts'

// DOM ELEMENT 
const mapBox = document.getElementById('map')
const loginForm = document.querySelector('.form--login')
const signupForm = document.querySelector('.form--signup')
const logoutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const bookBtn = document.querySelector('#book-tour')


// Values 

// IMPLEMENTATION

if (mapBox) { // if there is map section in DOM 
    // we have location data in id map in data-location 
    const locations = JSON.parse(mapBox.dataset.locations)

    displayMap(locations)
}

// add event listener to signup button 
if (signupForm) {
    signupForm.addEventListener('submit', e => {
        e.preventDefault()
        document.querySelector('.btn').textContent = 'Signing up...'
        const name = document.getElementById('name').value
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('passwordConfirm').value
        signup(name, email, password, passwordConfirm)

    })
}
// login using email and password 
if (loginForm) { // if there is login form in DOM 
    // listen to the submit event in login form
    loginForm.addEventListener('submit', e => {
        // prevents form from loading any other page.
        e.preventDefault();
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        login(email, password)
    })
}

// handles logout button 
if (logoutBtn) logoutBtn.addEventListener('click', logout)

// update name and email
if (userDataForm) {
    userDataForm.addEventListener('submit', e => {
        e.preventDefault()
        /**
         * @DESC If there is a multipart/form we need to programmatically create form object
         *      to tell the server that we have a file in our form.
         */
        const form = new FormData() // this object accepts multipart/form

        form.append('name', document.getElementById('name').value)
        form.append('email', document.getElementById('email').value)
        form.append('photo', document.getElementById('photo').files[0]) //only one file sent
        
        updateSettings(form, 'data')
    })
}

// update password 
if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault()
        document.querySelector('.btn--save-password').textContent = 'Updating...'

        const passwordCurrent = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value

        await updateSettings({
                passwordCurrent,
                password,
                passwordConfirm
            },
            'password'
        )

        document.querySelector('.btn--save-password').textContent = 'Save Password'
        document.getElementById('password-current').value = ''
        document.getElementById('password').value = ''
        document.getElementById('password-confirm').value = ''

    })
}

// book tour button 
if (bookBtn)
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing'
        const { tourId } = e.target.dataset 
        bookTour(tourId)
    })

// check for alert message in body 
const alertMessage = document.querySelector('body').dataset.alert

if (alertMessage) showAlert('success', alertMessage, 12) // hide after 8 second 
