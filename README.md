# TutorGuru Platform

The tuition industry depends on agents, causing high fees, slow matching, and little transparency.

TutorGuru directly connects parents and tutors, allowing flexible assignments and clear communication with no agents involved.

TutorGuru is a comprehensive tutoring platform built with Vue.js that connects tutors with students. This platform provides tutors with a dashboard to browse job postings, filter opportunities, and manage their profiles.

# Relevant Links
Youtube demo walkthrough: https://youtu.be/Y8PjdAynPCg

Github Repo:  https://github.com/Bradleysmu2024/TutorGuru.git

Deployed Application Link: http://dodieboy.codes/
## Features

- **Homepage**: Engaging landing page with hero section and platform statistics
- **Tutor Dashboard**: Browse and search through available tutoring opportunities
- **Advanced Filtering**: Filter jobs by subject, education level, location, and keywords
- **Profile Management**: Tutors can manage their information and upload credentials
- **File Upload**: Drag-and-drop file upload for certificates and documents
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile devices
- **Firebase Integration**: Ready for Firebase Authentication and Firestore database
- **Schedule Updates**: Parents and tutors are able to update their schedules by syncing their calendars
- **Messaging and Leaderboard**: Parents able to message tutors and view the top ones

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v22.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

To verify your installation, run:
```bash
node --version
npm --version
```

## Installation

Follow these steps to set up the project locally:

### 1. Download or Clone the Project

If you have the ZIP file:
- Extract the ZIP file to your desired location
- Open the folder in your code editor (VSCode recommended)

If using Git:
```bash
git clone <repository-url>
cd tutor-platform
```

### 2. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required dependencies including:
- Vue 3
- Vue Router 4
- Bootstrap 5
- Bootstrap Icons
- Firebase
- Vite (build tool)

### 3. Enter api key in .env file

1. cd to /apps/web/ using the below command
```bash
cd apps/web/
```
2. Create a .env file and fill the file with the following information
```
VUE_APP_API_KEY=...
VUE_APP_AUTH_DOMAIN=...
VUE_APP_PROJECT_ID=...
VUE_APP_STORAGE_BUCKET=...
VUE_APP_MESSAGING_SENDER_ID=...
VUE_APP_APP_ID=...
VUE_APP_MEASUREMENT_ID=...
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Available scripts (in `apps/web/package.json`)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run production` - Build and preview production build locally (recommended ways to run the project)

## Adding your own images

To use your own images in the carousel:


## Project structure

```
tutor-platform/
├── apps/web
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── assets/             # Images, styles, etc.
│   │   │   ├── images/         # Folder for custom images
│   │   │   ├── styles/         # CSS files
│   │   │   └── icons/          # Icon files
│   │   ├── components/         # Reusable Vue components
│   │   ├── views/              # Page components
│   │   ├── router/             # Vue Router configuration
│   │   │   └── index.js
│   │   ├── services/           # API and Firebase services
│   │   │   └── firebase.js
│   │   │   └── stripe.js
│   │   ├── App.vue             # Root component
│   │   └── main.js             # Application entry point
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── firestore.rules         # Firestore configuration
│   ├── firestore.indexes.json  # Firestore configuration
│   ├── storage.rules           # Firebase storage configuration
│   ├── vite.config.js          # Vite configuration
├── README.md
└── firebase.json               # Firebase configuration
```

## Firebase setup

The web client integrates with Firebase. A few notes to get you running:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the setup wizard
3. Enable Authentication (Email/Password)
4. Create a Firestore Database

### 2. Get Your Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click the web icon (</>) to create a web app
4. Copy the Firebase configuration

### 3. The client expects environment variables for the Firebase config. Create a `.env` (or `.env.local`) in `apps/web` with keys used by the code, for example:

```
VUE_APP_API_KEY=...
VUE_APP_AUTH_DOMAIN=...
VUE_APP_PROJECT_ID=...
VUE_APP_STORAGE_BUCKET=...
VUE_APP_MESSAGING_SENDER_ID=...
VUE_APP_APP_ID=...
VUE_APP_MEASUREMENT_ID=...
```

### 4. Run the below code to update firebase permission and setting

```bash
npm i firebase-tools
firebase deploy
```


## Development notes

- The repo contains `apps/web` (frontend) and `functions` (Cloud Functions) folders. Work inside `apps/web` for client changes.
- Some components include fallback/dummy data for development — check components/composables for mock data if you want to run without Firebase.

Authentication and Flow
- Users register and login via Firebase Auth. Protected routes rely on auth state.

File uploads
- File upload components wire to Firebase Storage when configured. They include client-side validation and progress UI.

### Authentication Flow

1. Users register/login through the authentication pages
2. Firebase Authentication handles user sessions
3. Protected routes require authentication
4. User data is stored in Firestore

### File Uploads

The file upload component supports:
- Drag and drop functionality
- Multiple file selection
- File type validation (PDF, DOC, DOCX, JPG, PNG)
- Progress tracking
- Firebase Storage integration (when configured)

## Recommended VSCode extensions

For the best development experience, install these extensions:

- **Vue (Official)** - Vue Language Features
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Auto Rename Tag** - Automatically rename paired tags
- **Path Intellisense** - Autocomplete filenames
- **Bootstrap Intellisense** - Intellisense for bootstrap

## Tech stack

- **Frontend Framework**: Vue 3 (Composition API)
- **Routing**: Vue Router 4
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Bootstrap Icons
- **Build Tool**: Vite
- **Backend**: Firebase (Authentication, Firestore, Storage)

## Troubleshooting

### Port already in use:

```bash
npm run dev -- --port 3000
```

### Dependencies not installing (Windows):

```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules,package-lock.json
npm install
```

Firebase issues: verify config keys, ensure Auth/Firestore enabled, and that your `.env` file values match the Firebase console credentials.

### Firebase Connection Issues

1. Verify your Firebase configuration is correct
2. Check that Authentication and Firestore are enabled in Firebase Console
3. Ensure your Firebase project has the web app registered

## Contributing

This project is part of a team assignment. Team members:
- **Dzaki** - Dashboard for tutors / parent, Tutor search filter, File upload, Email Session Reminder, Parent Dashboard
- **Jia Shun** - Message, Profile, Firebase, Hosting of website, Dark Mode
- **Bradley** - Payment, Transaction history, Home Page, Profile
- **Gyaltsen** - Firebase auth, Login pages, Google Maps, Assignment Search
- **Leonard** - Calendar Scheduling, Tutor Profile Management, Firebase Setup, Reset Password via email

## AI/LLM Usage

This project utilized AI/LLM tools (ChatGPT) for the following purposes:
- **Explaining coding errors and debugging hints** - AI was used to help understand error messages and suggest debugging approaches

## License

This project is for educational purposes.

## Support

For issues or questions, please contact the development team or refer to the project documentation.

---

Built with ❤️ using Vue.js and Firebase
