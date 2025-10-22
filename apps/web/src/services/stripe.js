import { loadStripe } from '@stripe/stripe-js'

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

console.log('Stripe Key Check:', {
  keyExists: !!stripePublicKey,
  keyPrefix: stripePublicKey?.substring(0, 7)
})

let stripePromise = null
if (stripePublicKey) {
  stripePromise = loadStripe(stripePublicKey)
} else {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not defined in .env file')
}

export const createPaymentSession = async (assignmentData) => {
  console.log('Creating Payment Session')
  
  try {
    const { paymentId, assignmentId, totalAmount, title, selectedTutor } = assignmentData || {}

    if (!paymentId) {
      throw new Error('Payment ID is required')
    }
    
    if (!assignmentId) {
      throw new Error('Assignment ID is required')
    }

    if (!totalAmount || totalAmount <= 0) {
      throw new Error('Invalid payment amount')
    }

    const requestBody = {
      paymentId: String(paymentId),
      assignmentId: String(assignmentId),
      amount: Math.round(Number(totalAmount) * 100),
      assignmentTitle: String(title || 'Assignment'),
      tutorName: String(selectedTutor?.name || 'Tutor'),
    }
    
    console.log('Payment Request:', requestBody)

    const response = await fetch('https://us-central1-tutor-72464.cloudfunctions.net/api/create-payment-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', errorText)
      throw new Error(`Server error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Session data:', data)

    if (!data.url) {
      throw new Error('No checkout URL from server')
    }

    window.location.href = data.url
    
  } catch (error) {
    console.error('Payment Error:', error)
    throw error
  }
}

export const verifyPayment = async (sessionId) => {
  try {
    const response = await fetch(`https://us-central1-tutor-72464.cloudfunctions.net/api/verify-payment/${sessionId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Verification error:', error)
    throw error
  }
}