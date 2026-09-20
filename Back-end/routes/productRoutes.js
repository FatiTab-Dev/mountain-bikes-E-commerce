import express from 'express';
import Product from '../models/Product.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Configure Cloudinary (it automatically reads from environment variables)
cloudinary.config();

// Setup Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "bike_projects",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: 'desc' });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Can't fetch products", error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Can't fetch product", error: error.message });
  }
});

// Create product (Handles image upload to Cloudinary)
router.post('/', upload.single('img'), async (req, res) => {
  try {
    const { title, price, desc, stock } = req.body;
    
    if (!title || !price) {
      return res.status(400).json({ message: 'Please provide title and price' });
    }

    // Get the Cloudinary image URL if a file was uploaded
    const imgUrl = req.file ? req.file.path : '';

    const newProduct = new Product({
      title,
      price,
      desc,
      img: imgUrl,
      stock,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: "Can't add product", error: error.message });
  }
});

// Update product (Handles changing the image or keeping the old one)
router.put('/:id', upload.single('img'), async (req, res) => {
  try {
    let updateData = { ...req.body };

    // If a new image is uploaded, update the image path with the new Cloudinary URL
    if (req.file) {
      updateData.img = req.file.path;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Server Error: Can't update product", error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Bike not found' });
    }
    res.status(200).json({ message: 'Product Deleted Successfully!🗑️' });
  } catch (error) {
    res.status(500).json({ message: "Server Error: Can't delete product", error: error.message });
  }
});

export default router;