import axios from 'axios'
import { showAlert } from './alerts'

export const login = async (email, password) => {
    try {
        // request to the api - ajax request
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password
            }
        })
        // if api call was successful or has status:success
        if (res.data.status === 'success') {
            showAlert('success','Logged in successfully')
            // reload after 1.5 seconds
            window.setTimeout(() => {
                location.assign('/')
            },1500)
        }
    } catch (err) {
        showAlert('error','Log in unsuccessful')
    }
}

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        })
        if (res.data.status === 'success') location.reload(true) // force reload from the server

    } catch (error) {
        console.log(error.response.data);
        showAlert('error','Error logging out, Try again!') 
    }
}

/** 
 * @DESC Creates a account 
 * @PARAM name,email,password, passwordConfirm 
 */
export const signup = async (name, email, password, passwordConfirm) => {
    try {
        document.querySelector('.btn').textContent = 'Processing ...'
        // ajax call 
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm
            }
        })
        if (res.data.status === 'success') {
            showAlert('success', 'Welcome')
            //reload after 1.5 second  and redirect to login Page
            window.setTimeout(() => {
                location.assign('/')
            }, 1500)
        }

    } catch (error) {
        const message = error.response.data.message
        showAlert('error', `signup unsuccessful ${message}`)
        // stay on the same page
        document.querySelector('.btn').textContent = 'Signup'
         
    }
}