# RepLog 💪

A modern, full-stack gym tracking application built with Next.js 15, TypeScript, and MongoDB. Track your workout programs, log your sets and reps, and monitor your progress over time.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)

## 🌟 Features

### Core Functionality
- **User Authentication** - Secure sign up and login with NextAuth.js
- **Custom Workout Programs** - Create unlimited programs with your own exercises
- **Workout Tracking** - Log weights, reps, and sets for every exercise
- **Workout History** - View all your past workouts with dates
- **Previous Workout Data** - See your last workout's weights and reps to beat your personal records
- **Quick Copy** - One-click to copy weights from your previous workout
- **Program Management** - Edit and delete workout programs
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile

### User Experience
- ✅ Clean, modern UI with Tailwind CSS
- ✅ Real-time form validation
- ✅ Loading states and error handling
- ✅ Protected routes (authentication required)
- ✅ Intuitive navigation
- ✅ Visual feedback (completed sets turn green)

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **MongoDB Atlas**

### Authentication
- **NextAuth.js v4**
- **bcryptjs** (password hashing)
- **JWT sessions**

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **MongoDB Atlas** account (free tier available)
- **Git** (optional, for cloning)

## 🚀 Installation & Setup

### 1. Clone or Download the Project

```bash
git clone <your-repo-url>
cd replog
```

Or download and extract the ZIP file.

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages:
- Next.js and React
- Prisma and MongoDB client
- NextAuth.js for authentication
- bcryptjs for password hashing
- TypeScript and Tailwind CSS

### 3. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Click "Database Access" → Add a database user
   - Username: `replog_user` (or your choice)
   - Password: Create a strong password
   - Privileges: Read and write to any database
5. Click "Network Access" → Add IP Address
   - Allow access from anywhere: `0.0.0.0/0` (for development)
6. Click "Database" → Connect → "Connect your application"
7. Copy the connection string
8. Replace `<password>` with your actual password
9. Add `/replog` at the end

Your connection string should look like:
```
mongodb+srv://replog_user:yourpassword@cluster0.xxxxx.mongodb.net/replog
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="mongodb+srv://your-user:your-password@cluster0.xxxxx.mongodb.net/replog"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 5. Set Up the Database

Generate Prisma client and push the schema to MongoDB:

```bash
npx prisma generate
npx prisma db push
```

This creates all the necessary collections in your MongoDB database.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 📱 Usage Guide

### First Time Setup

1. **Create an Account**
   - Click "Sign Up" on the login page
   - Enter your name, email, and password (minimum 6 characters)
   - You'll be automatically logged in

2. **Create Your First Program**
   - Click "New Program" in the navbar
   - Give it a name (e.g., "Push Day", "Leg Day")
   - Add exercises with target sets and reps
   - Click "Create Program"

3. **Log Your First Workout**
   - Go to Dashboard
   - Click "Start Workout" on any program
   - Enter the weight and reps you performed
   - Check off sets as you complete them
   - Add notes if desired
   - Click "Complete Workout"

### Daily Workflow

1. Open RepLog
2. Click "Start Workout" on the program you want to do
3. You'll see your previous workout data (weights and reps)
4. Use "Copy Last" buttons to quickly fill in weights
5. Log your actual performance
6. Complete the workout
7. View your history on the dashboard

## 📁 Project Structure

```
replog/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   ├── register/             # User registration
│   │   ├── programs/             # Program CRUD operations
│   │   └── workouts/             # Workout logging
│   ├── dashboard/                # Main dashboard page
│   ├── programs/
│   │   └── new/                  # Create new program
│   ├── workout/[programId]/      # Workout logging page
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Login/signup page
│   └── globals.css               # Global styles
├── components/
│   ├── Navbar.tsx                # Navigation bar
│   └── ProtectedRoute.tsx        # Authentication wrapper
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   └── prisma.ts                 # Prisma client
├── prisma/
│   └── schema.prisma             # Database schema
├── types/
│   └── next-auth.d.ts            # NextAuth type extensions
├── .env                          # Environment variables
├── prisma.config.ts              # Prisma 6 config
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

## 🗄️ Database Schema

### Collections

- **User** - User accounts with hashed passwords
- **Program** - Workout programs (belongs to User)
- **Exercise** - Exercises within programs
- **Workout** - Logged workout sessions
- **WorkoutSet** - Individual sets with weight/reps
- **Account** & **Session** - NextAuth authentication

### Key Relationships

```
User → Programs (one-to-many)
Program → Exercises (one-to-many)
Program → Workouts (one-to-many)
Workout → WorkoutSets (one-to-many)
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Sessions** - Secure token-based authentication
- **Protected Routes** - Client-side route protection
- **API Authorization** - Server-side session validation
- **CSRF Protection** - Built into NextAuth
- **Environment Variables** - Sensitive data not in code

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
5. Deploy!

### Other Platforms

Works on any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS
- Google Cloud

**Important:** Update `NEXTAUTH_URL` to your production domain!

## 🎯 Future Enhancements

Ideas for expanding RepLog:

### Short-term
- [ ] Edit existing programs
- [ ] View detailed workout history per exercise
- [ ] Progress charts (weight over time)
- [ ] Rest timer between sets
- [ ] Exercise library with instructions
- [ ] Export workout data to CSV

### Medium-term
- [ ] Personal records tracking
- [ ] Body measurements and progress photos
- [ ] Workout templates (share with friends)
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Workout reminders/notifications

### Long-term
- [ ] Social features (follow friends, share workouts)
- [ ] AI-powered program recommendations
- [ ] Integration with fitness trackers
- [ ] Nutrition tracking
- [ ] Coach/trainer accounts
- [ ] Leaderboards and challenges

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Errors:**
- Verify your connection string in `.env`
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure the password doesn't contain special characters that need URL encoding

**Prisma Errors:**
```bash
# Reset and regenerate
npx prisma generate
npx prisma db push
```

**Login/Session Issues:**
- Clear browser cookies
- Verify `NEXTAUTH_SECRET` is set in `.env`
- Check that `NEXTAUTH_URL` matches your development URL

**Build Errors:**
```bash
# Clean install
rm -rf .next node_modules
npm install
npm run dev
```

## 📚 Learning Resources

If you're new to these technologies:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Guide](https://next-auth.js.org/getting-started/introduction)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

This is a learning project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Built as a learning project to explore:
- Next.js 15 App Router
- TypeScript best practices
- MongoDB with Prisma
- Full-stack authentication
- Modern React patterns

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Tailwind CSS for making styling easy
- The MongoDB team for Atlas free tier
- NextAuth.js for authentication made simple

## 💬 Support

If you have questions or run into issues:
1. Check the Troubleshooting section above
2. Review the documentation for each technology
3. Search for similar issues on Stack Overflow
4. Open an issue in the repository

---

**Happy Lifting!** 💪 Track your progress, beat your PRs, and achieve your fitness goals with RepLog!