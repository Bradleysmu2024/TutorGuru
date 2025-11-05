# TutorGuru Platform

A comprehensive tutoring platform built with Vue.js that connects tutors with students. This platform provides tutors with a dashboard to browse job postings, filter opportunities, and manage their profiles.

## Features

- **Homepage**: Engaging landing page with hero section and platform statistics
- **Tutor Dashboard**: Browse and search through available tutoring opportunities
- **Advanced Filtering**: Filter jobs by subject, education level, location, and keywords
- **Profile Management**: Tutors can manage their information and upload credentials
- **File Upload**: Drag-and-drop file upload for certificates and documents
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile devices
- **Firebase Integration**: Ready for Firebase Authentication and Firestore database

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
npm i firebase-tools
firebase deploy
```

This will install all required dependencies including:
- Vue 3
- Vue Router 4
- Bootstrap 5
- Bootstrap Icons
- Firebase
- Vite (build tool)

### 3. Start the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Available scripts (in `apps/web/package.json`)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Adding your own images

To use your own images in the carousel:

### 1. Create the Images Folder

Create a folder structure: `src/assets/images/`

### 2. Add Your Images

Place your images in the `src/assets/images/` folder. Supported formats:
- JPG/JPEG
- PNG
- WebP
- SVG

### 3. Update the Carousel Component

Open `src/components/Carousel.vue` and update the import statements with your actual image filenames:

```javascript
import image1 from '@/assets/images/your-image-1.jpg'
import image2 from '@/assets/images/your-image-2.jpg'
import image3 from '@/assets/images/your-image-3.jpg'
import image4 from '@/assets/images/your-image-4.jpg'
```

The `@` symbol is an alias for the `src` directory, so `@/assets/images/` points to `src/assets/images/`.

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

4. Open `src/services/firebase.js` to confirm which env keys the project expects and adjust as needed.


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
- **Dzaki** - Tutor Dashboard, Search/Filter, File Upload
- **Jia Shun** - Message, Profile, Firebase

## License

This project is for educational purposes.

## Support

For issues or questions, please contact the development team or refer to the project documentation.

---

Built with ❤️ using Vue.js and Firebase
