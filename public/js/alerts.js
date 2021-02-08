/**
 * @DESC finds the alert box hides  it  
 */
export const hideAlert = () => {
    const alertBox = document.querySelector('.alert')
    if(alertBox) alertBox.parentElement.removeChild(alertBox)
}

/**
 * @DESC shows nice alert 
 * @param type is 'success' or 'error'
 * @param message 'what message to display
 */
export const showAlert = (type, message, timeToShowAlert = 15) => {
    hideAlert()
    const alertBox = `<div class="alert alert--${type}">${message}</div>`
    document.querySelector('body').insertAdjacentHTML('afterbegin', alertBox)
    window.setTimeout(hideAlert, timeToShowAlert * 1000) // hide alert after 5 seconds 
}