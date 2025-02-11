const express = require('express');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');

// Initialize Express app
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/contacts_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String }
});

const Contact = mongoose.model('Contact', ContactSchema);

// POST /contacts - Create a new contact
app.post('/contacts', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const contact = new Contact(req.body);
        await contact.save();
        res.status(201).json(contact);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /contacts/:id - Fetch a single contact
app.get('/contacts/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        res.json(contact);
    } catch (error) {
        res.status(400).json({ error: 'Invalid Contact ID' });
    }
});

// PUT /contacts/:id - Update an existing contact
app.put('/contacts/:id', [
    param('id').isMongoId().withMessage('Invalid ID format'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().notEmpty().withMessage('Phone number cannot be empty')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        res.json(contact);
    } catch (error) {
        res.status(400).json({ error: 'Invalid Contact ID' });
    }
});

// DELETE /contacts/:id - Delete a contact
app.delete('/contacts/:id', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Invalid Contact ID' });
    }
});

// GET /contacts/search?query= - Search contacts by name or email
app.get('/contacts/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });
    try {
        const contacts = await Contact.find({
            $or: [
                { name: new RegExp(query, 'i') },
                { email: new RegExp(query, 'i') }
            ]
        });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(Server running on port ${PORT}));