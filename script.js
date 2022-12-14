class Book {
  constructor(
    title = 'Unknown',
    author = 'Unknown',
    pages = '0',
    isRead = false
  ) {
    this.title = title
    this.author = author
    this.pages = pages
    this.isRead = isRead
  }
}

class Library {
  constructor() {
    this.books = []
  }

  addBook(newBook) {
    if (!this.isInLibrary(newBook)) {
      this.books.push(newBook)
    }
  }

  removeBook(title) {
    this.books = this.books.filter((book) => book.title !== title)
  }

  getBook(title) {
    return this.books.find((book) => book.title === title)
  }

  isInLibrary(newBook) {
    return this.books.some((book) => book.title === newBook.title)
  }
}

const library = new Library()

const addBookBtn = document.getElementById('addBookBtn')
const addBookModal = document.getElementById('addBookModal')
const errorMsg = document.getElementById('errorMsg')
const overlay = document.getElementById('overlay')
const addBookForm = document.getElementById('addBookForm')
const booksGrid = document.getElementById('booksGrid')


const openAddBookModal = () => {
  addBookForm.reset()
  addBookModal.classList.add('active')
  overlay.classList.add('active')
}

const closeAddBookModal = () => {
  addBookModal.classList.remove('active')
  overlay.classList.remove('active')
  errorMsg.classList.remove('active')
  errorMsg.textContent = ''
}

const openAccountModal = () => {
  accountModal.classList.add('active')
  overlay.classList.add('active')
}

const closeAccountModal = () => {
  accountModal.classList.remove('active')
  overlay.classList.remove('active')
}

const closeAllModals = () => {
  closeAddBookModal()
  closeAccountModal()
}

const handleKeyboardInput = (e) => {
  if (e.key === 'Escape') closeAllModals()
}

const updateBooksGrid = () => {
  resetBooksGrid()
  for (let book of library.books) {
    createBookCard(book)
  }
}

const resetBooksGrid = () => {
  booksGrid.innerHTML = ''
}

const createBookCard = (book) => {
  const bookCard = document.createElement('div')
  const title = document.createElement('p')
  const author = document.createElement('p')
  const pages = document.createElement('p')
  const buttonGroup = document.createElement('div')
  const readBtn = document.createElement('button')
  const removeBtn = document.createElement('button')

  bookCard.classList.add('book-card')
  buttonGroup.classList.add('button-group')
  readBtn.classList.add('btn')
  removeBtn.classList.add('btn')
  readBtn.onclick = toggleRead
  removeBtn.onclick = removeBook

  title.textContent = `"${book.title}"`
  author.textContent = book.author
  pages.textContent = `${book.pages} pages`
  removeBtn.textContent = 'Remove'

  if (book.isRead) {
    readBtn.textContent = 'Read'
    readBtn.classList.add('btn-light-green')
  } else {
    readBtn.textContent = 'Not read'
    readBtn.classList.add('btn-light-red')
  }

  bookCard.appendChild(title)
  bookCard.appendChild(author)
  bookCard.appendChild(pages)
  buttonGroup.appendChild(readBtn)
  buttonGroup.appendChild(removeBtn)
  bookCard.appendChild(buttonGroup)
  booksGrid.appendChild(bookCard)
}

const getBookFromInput = () => {
  const title = document.getElementById('title').value
  const author = document.getElementById('author').value
  const pages = document.getElementById('pages').value
  const isRead = document.getElementById('isRead').checked
  return new Book(title, author, pages, isRead)
}

const addBook = (e) => {
  e.preventDefault()
  const newBook = getBookFromInput()

  if (library.isInLibrary(newBook)) {
    errorMsg.textContent = 'This book already exists in your library'
    errorMsg.classList.add('active')
    return
  }

  if (auth.currentUser) {
    addBookDB(newBook)
  } else {
    library.addBook(newBook)
    saveLocal()
    updateBooksGrid()
  }

  closeAddBookModal()
}

const removeBook = (e) => {
  const title = e.target.parentNode.parentNode.firstChild.innerHTML.replaceAll(
    '"',
    ''
  )

  if (auth.currentUser) {
    removeBookDB(title)
  } else {
    library.removeBook(title)
    saveLocal()
    updateBooksGrid()
  }
}

const toggleRead = (e) => {
  const title = e.target.parentNode.parentNode.firstChild.innerHTML.replaceAll(
    '"',
    ''
  )
  const book = library.getBook(title)

  if (auth.currentUser) {
    toggleBookIsReadDB(book)
  } else {
    book.isRead = !book.isRead
    saveLocal()
    updateBooksGrid()
  }
}

accountBtn.onclick = openAccountModal
addBookBtn.onclick = openAddBookModal
overlay.onclick = closeAllModals
addBookForm.onsubmit = addBook
window.onkeydown = handleKeyboardInput

// Local Storage

const saveLocal = () => {
  localStorage.setItem('library', JSON.stringify(library.books))
}

const restoreLocal = () => {
  const books = JSON.parse(localStorage.getItem('library'))
  if (books) {
    library.books = books.map((book) => JSONToBook(book))
  } else {
    library.books = []
  }
}

// Auth

const auth = firebase.auth()
const logInBtn = document.getElementById('logInBtn')
const logOutBtn = document.getElementById('logOutBtn')

auth.onAuthStateChanged(async (user) => {
  if (user) {
    setupRealTimeListener()
  } else {
    if (unsubscribe) unsubscribe()
    restoreLocal()
    updateBooksGrid()
  }
  setupAccountModal(user)
  setupNavbar(user)
})

const signIn = () => {
  const provider = new firebase.auth.GoogleAuthProvider()
  auth.signInWithPopup(provider)
}

const signOut = () => {
  auth.signOut()
}

logInBtn.onclick = signIn
logOutBtn.onclick = signOut


// Utils

const docsToBooks = (docs) => {
  return docs.map((doc) => {
    return new Book(
      doc.data().title,
      doc.data().author,
      doc.data().pages,
      doc.data().isRead
    )
  })
}

const JSONToBook = (book) => {
  return new Book(book.title, book.author, book.pages, book.isRead)
}

const bookToDoc = (book) => {
  return {
    ownerId: auth.currentUser.uid,
    title: book.title,
    author: book.author,
    pages: book.pages,
    isRead: book.isRead,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  }
}