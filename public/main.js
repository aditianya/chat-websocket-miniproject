const socket = io()

const clientsTotal = document.getElementById('clients-total')

const messageContainer = document.getElementById('message-container')
const nameInput = document.getElementById('name-input')
const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')
const messageTone = new Audio('/message-tone.mp3')
const feedbackItem = document.querySelector('.message-feedback')
const feedback = document.getElementById('feedback')
let typingTimeout
let isTyping = false

messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  sendMessage()
})

messageInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return

  e.preventDefault()
  sendMessage()
})

socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`
})

socket.on('connect', () => {
  clientsTotal.innerText = 'Connected; updating client count...'
})

socket.on('disconnect', () => {
  clientsTotal.innerText = 'Disconnected from server'
})

socket.on('connect_error', () => {
  clientsTotal.innerText = 'Unable to connect to server'
})

function sendMessage() {
  const message = messageInput.value
  if (message.trim() === '') return

  stopTyping()
  const data = {
    name: nameInput.value.trim() || 'anonymous',
    message,
    dateTime: new Date(),
  }
  socket.emit('message', data)
  addMessageToUI(true, data)
  messageInput.value = ''
  messageInput.focus()
}

socket.on('chat-message', (data) => {
  messageTone.currentTime = 0
  messageTone.play().catch((error) => {
    console.warn('Unable to play the new-message sound:', error)
  })
  addMessageToUI(false, data)
})

function addMessageToUI(isOwnMessage, data) {
  const messageElement = document.createElement('li')
  messageElement.classList.add(isOwnMessage ? 'message-right' : 'message-left')

  const textElement = document.createElement('p')
  textElement.classList.add('message')
  textElement.textContent = data.message

  const detailsElement = document.createElement('span')
  const dateTime = new Date(data.dateTime)
  detailsElement.textContent = `${data.name} ● ${dateTime.toLocaleTimeString()}`

  textElement.append(detailsElement)
  messageElement.append(textElement)
  messageContainer.append(messageElement)
  scrollToBottom()
}

function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

messageInput.addEventListener('input', () => {
  if (messageInput.value.trim() === '') {
    stopTyping()
    return
  }

  if (!isTyping) {
    isTyping = true
    socket.emit('feedback', {
      feedback: `✍️ ${nameInput.value.trim() || 'anonymous'} is typing`,
    })
  }

  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(stopTyping, 2000)
})

messageInput.addEventListener('blur', stopTyping)

function stopTyping() {
  clearTimeout(typingTimeout)
  if (!isTyping) return

  isTyping = false
  socket.emit('feedback', { feedback: '' })
}

socket.on('feedback', (data) => {
  feedback.textContent = data.feedback
  feedbackItem.hidden = !data.feedback
})