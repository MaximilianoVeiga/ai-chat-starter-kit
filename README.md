# AI Chat Starter Kit

A modern, fully-featured AI chat application starter kit built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui. Perfect for building AI-powered chat applications with a beautiful, responsive interface.

## ✨ Features

### 🤖 AI Chat Interface
- **Real-time messaging** - Send and receive messages with typing indicators
- **Message history** - Persistent conversation threads with auto-scrolling
- **Chat bubbles** - Beautifully designed message bubbles for user and AI responses
- **Timestamps** - Message timestamps with proper formatting

### 👤 Authentication System
- **Login/Register** - Complete authentication flow with form validation
- **Protected routes** - Route protection for authenticated users
- **Mock authentication** - Ready-to-replace mock auth system
- **User management** - User profile and session handling

### 💬 Conversation Management
- **Multiple conversations** - Create and manage multiple chat threads
- **Conversation sidebar** - Easy navigation between different conversations
- **Auto-generated titles** - Smart conversation titles based on first message
- **Conversation persistence** - Local storage for conversation history

### 🎨 Modern UI/UX
- **shadcn/ui components** - Beautiful, accessible UI components
- **Dark/Light mode** - Theme switching with system preference detection
- **Responsive design** - Mobile-first design that works on all devices
- **Smooth animations** - Polished animations and transitions
- **Loading states** - Proper loading indicators and skeleton screens

### 🛠️ Developer Experience
- **TypeScript** - Full type safety throughout the application
- **ESLint & Prettier** - Code linting and formatting
- **Hot reload** - Fast development with Vite
- **Component organization** - Well-structured component architecture
- **Context API** - Centralized state management for chat functionality

## 🚀 Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **State Management**: React Context API
- **Development**: ESLint, TypeScript ESLint

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat-starter-kit.git
   cd ai-chat-starter-kit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

## 🧞 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run clean` | Clean build directory |

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── chat/            # Chat-related components
│   │   ├── ChatArea.tsx        # Main chat interface
│   │   └── ConversationSidebar.tsx # Conversation list
│   ├── ui/              # shadcn/ui components
│   └── ProtectedRoute.tsx # Route protection
├── contexts/            # React contexts
│   └── ChatContext.tsx  # Chat state management
├── hooks/               # Custom hooks
├── pages/               # Page components
│   ├── auth/           # Authentication pages
│   └── chat/           # Chat pages
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
└── main.tsx           # Application entry point
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# API Configuration (replace with your AI service)
VITE_API_URL=https://api.openai.com/v1
VITE_API_KEY=your_api_key_here

# App Configuration
VITE_APP_NAME="AI Chat Starter Kit"
VITE_APP_VERSION="1.0.0"
```

### Customization

1. **Replace Mock Authentication**
   - Update `src/pages/auth/LoginPage.tsx`
   - Integrate with your preferred auth service (Firebase, Auth0, etc.)

2. **Connect to AI Service**
   - Update chat context in `src/contexts/ChatContext.tsx`
   - Add your AI API integration (OpenAI, Anthropic, etc.)

3. **Styling**
   - Modify `tailwind.config.js` for custom themes
   - Update shadcn/ui component variants in `src/components/ui/`

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for the blazing fast build tool
- [React](https://reactjs.org/) for the component-based architecture

## 📞 Support

If you have any questions or need help getting started:

- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/ai-chat-starter-kit/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/ai-chat-starter-kit/discussions)

---

**Happy coding!** 🎉 Star ⭐ this repo if you find it helpful!