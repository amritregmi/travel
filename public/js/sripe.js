import axios from "axios"
const stripe = Stripe('pk_test_51I6EKyEmX29aiJaNxBIQEQHVasmAg6o3EKBsRIaLl9vElWd919twXf94XWIZlFP3TMMwTng3X5evzfrfoCmoFFmy00lNwjF4DK')
import { showAlert } from './alerts'


/**
 * Get the session from the server. HOW? 
 * Our Server with the help of  private key and item has sent request to Stripe
 * Stripe then has stored the information
 */
export const bookTour = async tourId => {

    // Now we have to grab that checkout session from front end using public key 
    // by calling our api at /api/v1/bookings/checkout-session/:id
    try {
        const session = await axios({
            method: 'GET',
            url: `/api/v1/bookings/checkout-session/${tourId}`,

        })

        // Create Checkout with the help of session coming from server
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })


    } catch (error) {
        console.log(error);
        showAlert('error', error)
    }



}