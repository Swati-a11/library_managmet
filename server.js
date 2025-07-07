const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/bookelated'; // Replace with your MongoDB URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error(err));

// Models
const Book = mongoose.model('Book', new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    category: String,
}));

const IssuedBook = mongoose.model('IssuedBook', new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    issuedBy: String,
    returnDate: Date,
}));

const ReturnedBook = mongoose.model('ReturnedBook', new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    returnedBy: String,
    returnedDate: Date,
}));

// Routes
// Get all books
app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching books', error: err });
    }
});

// Add a book
app.post('/api/books', async (req, res) => {
    try {
        const newBook = new Book(req.body);
        await newBook.save();
        res.json({ message: 'Book added!', book: newBook });
    } catch (err) {
        res.status(500).json({ message: 'Error adding book', error: err });
    }
});

// Get issued books for a user
app.get('/api/issued-books', async (req, res) => {
    const { userId } = req.query;
    try {
        const query = userId ? { issuedBy: userId } : {};
        const issuedBooks = await IssuedBook.find(query);
        res.json(issuedBooks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching issued books', error: err });
    }
});

// Return a book
app.post('/api/return-book', async (req, res) => {
    const { bookId, returnedBy } = req.body;
    try {
        const bookToReturn = await IssuedBook.findById(bookId);
        if (!bookToReturn) {
            return res.status(404).json({ message: 'Book not found in issued list' });
        }

        const returnedBook = new ReturnedBook({
            title: bookToReturn.title,
            description: bookToReturn.description,
            category: bookToReturn.category,
            returnedBy,
            returnedDate: new Date(),
        });
        await returnedBook.save();

        await bookToReturn.deleteOne();

        res.json({ message: 'Book returned successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Error returning book', error: err });
    }
});

// Get returned books
app.get('/api/returned-books', async (req, res) => {
    try {
        const returnedBooks = await ReturnedBook.find();
        res.json(returnedBooks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching returned books', error: err });
    }
});

// Serve HTML files (optional fallback for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/HOMEe.html'));
});

// Server Setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
