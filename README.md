# 🎨 ImagineAI - AI Image Generation Web App

Transform your ideas into stunning images with the power of AI! ImagineAI is a full-stack web application that uses Google's Gemini AI model to generate beautiful, unique images from simple text prompts.

## ✨ Features

- **🚀 AI-Powered Image Generation** - Create stunning images from text descriptions using Google's Gemini AI
- **🔐 Secure Authentication** - User registration and login with JWT tokens
- **📚 Image History** - Save and view all your generated images
- **💾 Download Images** - Download your creations in high quality
- **📱 Responsive Design** - Works perfectly on desktop and mobile devices
- **⚡ Fast & Intuitive** - Clean, modern interface for seamless user experience

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database for user data and image history
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Google GenAI** - AI image generation

### Frontend
- **HTML5** - Structure
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - Dynamic interactions
- **Responsive Design** - Mobile-first approach

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/khizar925/imagine-ai.git
   cd imagine-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm install @google/genai@latest
   ```

3. **Set up the database**
   ```bash
   npm run setup-db
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   Navigate to http://localhost:3000
   ```

## 📁 Project Structure

```
imagine-ai/
├── public/                 # Frontend files
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── signup.html        # Registration page
│   ├── app.html           # Main application
│   ├── styles.css         # Styling
│   ├── app.js            # Main app logic
│   └── auth.js           # Authentication logic
├── scripts/
│   └── init-database.sql  # Database schema
├── server.js              # Main server file
├── setup-db.js           # Database setup script
├── package.json           # Dependencies
└── README.md             # This file
```

## 🎯 How to Use

1. **Sign Up** - Create a new account with username, email, and password
2. **Login** - Access your account with your credentials
3. **Generate Images** - Enter a descriptive prompt and click "Generate Image"
4. **View History** - See all your previously generated images in the sidebar
5. **Download** - Save your favorite creations to your device


## 🎨 Example Prompts

Try these creative prompts to get started:

- "A serene mountain landscape at sunset with a lake reflection"
- "A futuristic city with flying cars and neon lights"
- "A magical forest with glowing mushrooms and fairy lights"
- "An abstract painting with vibrant colors and geometric shapes"
- "A cozy coffee shop interior with warm lighting"

## 🚀 Features in Detail

### Authentication System
- Secure user registration and login
- JWT-based session management
- Password hashing with bcrypt
- Protected routes and API endpoints

### Image Generation
- Powered by Google's Gemini AI model
- High-quality image output
- Fast generation times
- Support for detailed prompts

### User Experience
- Intuitive interface design
- Real-time loading indicators
- Responsive layout for all devices
- Clean, modern aesthetic

## 🔒 Security Features

- **Password Encryption** - All passwords are hashed using bcrypt
- **JWT Authentication** - Secure token-based authentication
- **Input Sanitization** - Protection against malicious inputs
- **CORS Protection** - Configured for secure cross-origin requests

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Image generation may take 10-30 seconds depending on complexity
- Large images may take longer to load in the history panel
- Some complex prompts may require multiple attempts

## 🔮 Future Enhancements

- [ ] Image editing capabilities
- [ ] Multiple image styles/models
- [ ] Batch image generation
- [ ] Social sharing features
- [ ] Premium subscription tiers
- [ ] Mobile app development

## 📧 Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the developer through social media

## 👨‍💻 Developer

**Khizar Qamar**

I'm a passionate full-stack developer who loves creating innovative web applications. This project showcases modern web development practices combined with cutting-edge AI technology.

### 🌐 Connect with me:

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://www.github.com/khizar925)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/khizarqamar)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://www.x.com/khizarqamar05)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://khizarqamar.me/)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/khizarqamar)

</div>

---

<div align="center">

**⭐ If you found this project helpful, please give it a star! ⭐**

*Made with ❤️ by [Khizar Qamar](https://github.com/khizar925)*

</div>
