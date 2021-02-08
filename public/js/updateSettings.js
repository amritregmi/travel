// changing user name and email and photo

import axios from 'axios'
import {showAlert} from './alerts'

// type is either password or data
export const updateSettings = async(data, type ) => {
    try {
        const url = type === 'password'
            ? '/api/v1/users/updateMyPassword'
            : '/api/v1/users/updateMe'
        
        const res = await axios({
            method: 'PATCH',
            url,
            data
        })
        if (res.data.status === 'success') {
            showAlert('success',`${type.toUpperCase()} updated successfully`)
        }
    } catch (error) {
        showAlert('error',error.response.data.message)
    }
}

export const updatePassword = async (passwordCurrent,password,passwordConfirm)=>{
    try {
        const res = await axios({
            method: 'PATCH',
            url: 'http://127.0.0.1:3000/api/v1/users/updateMyPassword',
            data: {
                passwordCurrent,password,passwordConfirm
            }
        })
        if (res.data.status === 'success') {
            showAlert('success','Password update successful')
        }
    } catch (error) {
        showAlert('error',error.response.data.message)
    }
}