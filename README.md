# Målerjakt (Moth Hunt) - Citizen Science App

A modern, cross-platform web application for citizen science moth observation and tracking. This application allows users to capture and submit moth observations with geolocation data, view observations on a map, and participate in scientific research.

## 📱 Project Overview

Målerjakt ("Moth Hunt") is a citizen science mobile app that enables users to contribute to moth research by submitting photos with geolocation data. The app is designed to be accessible on iOS, Android, and desktop browsers through a modern web interface.

### Core Features

- 📸 Take photos using native camera or select from gallery
- 📍 Automatic geolocation tagging
- 🗺️ Interactive map visualization of observations
- 🌐 Multilingual support (Norwegian and English)
- 📱 Progressive Web App (PWA) capabilities
- 🔄 Offline support with local storage
- 👤 Admin dashboard for data review and export

## 🧩 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Maps**: Leaflet with OpenStreetMap
- **Mobile**: PWA with Capacitor integration
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Vercel account (optional, for deployment)

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=your_app_url
\`\`\`

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/malerjakt.git
   cd malerjakt
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL scripts in the `supabase` directory to set up tables and policies
   - Create a storage bucket named "observations"

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

### Mobile Setup with Capacitor

1. Build the Next.js app:
   \`\`\`bash
   npm run build
   \`\`\`

2. Sync Capacitor:
   \`\`\`bash
   npm run cap:sync
   \`\`\`

3. Open in Xcode or Android Studio:
   \`\`\`bash
   npm run cap:open:ios
   # or
   npm run cap:open:android
   \`\`\`

## 📂 Project Structure

\`\`\`
malerjakt/
├── app/                    # Next.js app directory
│   ├── admin/              # Admin dashboard
│   ├── camera/             # Camera page
│   ├── gallery/            # Gallery selection page
│   ├── history/            # Observation history
│   ├── info/               # Information pages
│   ├── map/                # Map visualization
│   ├── subscribe/          # Newsletter subscription
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── admin/              # Admin components
│   ├── history/            # History components
│   ├── map/                # Map components
│   ├── ui/                 # UI components (shadcn)
│   └── ...                 # Other components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
│   ├── api.ts              # API functions
│   ├── supabase/           # Supabase client and types
│   ├── translations.ts     # Internationalization
│   └── ...                 # Other utilities
├── public/                 # Static assets
├── supabase/               # Supabase setup scripts
├── capacitor.config.ts     # Capacitor configuration
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── package.json            # Project dependencies
\`\`\`

## 🔑 Key Features Implemented

### 1. Image Capture and Upload

The app allows users to capture images using their device camera or select from the gallery. Images are processed, compressed, and uploaded to Supabase Storage with associated metadata.

\`\`\`typescript
// Example of image capture and upload
const capturePhoto = () => {
  if (videoRef.current && canvasRef.current) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
    }
  }
};
\`\`\`

### 2. Geolocation Integration

The app automatically captures the user's location when submitting observations.

\`\`\`typescript
// Example of geolocation usage
const { position, hasGeolocation } = useGeolocation();
// ...
const geolocation = {
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
};
\`\`\`

### 3. Map Visualization

Observations are displayed on an interactive map using Leaflet and OpenStreetMap.

\`\`\`typescript
// Example of map implementation
<MapContainer
  center={defaultCenter}
  zoom={5}
  style={{ height: "100%", width: "100%" }}
>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
  {observations.map((observation) => (
    <Marker
      key={observation.id}
      position={[observation.geolocation.latitude, observation.geolocation.longitude]}
    >
      <Popup>
        <div className="max-w-xs">
          <img src={observation.imageUrl || "/placeholder.svg"} alt={observation.comment} />
          <h3>{observation.comment}</h3>
        </div>
      </Popup>
    </Marker>
  ))}
</MapContainer>
\`\`\`

### 4. Multilingual Support

The app supports both Norwegian and English languages.

\`\`\`typescript
// Example of language switching
const { language, setLanguage } = useLanguage();
const { t } = useTranslation();

// Usage
<Button onClick={() => setLanguage('no')}>Norsk</Button>
<Button onClick={() => setLanguage('en')}>English</Button>
<h1>{t("appName")}</h1>
\`\`\`

### 5. Offline Support

The app stores observations locally when offline and syncs when online.

\`\`\`typescript
// Example of local storage
export async function saveLocalObservation(observation: LocalObservation): Promise<void> {
  const existingObservations = await getLocalObservations();
  const updatedObservations = [observation, ...existingObservations];
  localStorage.setItem(LOCAL_OBSERVATIONS_KEY, JSON.stringify(updatedObservations));
}
\`\`\`

### 6. Admin Dashboard

An admin interface for reviewing submissions, exporting data, and managing the application.

\`\`\`typescript
// Example of admin functionality
const updateStatus = (id: string, status: string) => {
  setObservations((prev) => 
    prev.map((obs) => (obs.id === id ? { ...obs, status } : obs))
  );
};
\`\`\`

## 📊 Current Status

The application is currently in a functional prototype stage with the following completion estimates:

| Feature | Status | Completion % |
|---------|--------|-------------|
| Core UI Framework | Implemented | 95% |
| Camera Integration | Implemented | 90% |
| Gallery Selection | Implemented | 90% |
| Geolocation | Implemented | 95% |
| Supabase Integration | Implemented | 85% |
| Image Upload | Implemented | 80% |
| Map Visualization | Implemented | 85% |
| Multilingual Support | Implemented | 90% |
| Offline Support | Partially Implemented | 70% |
| Admin Dashboard | Partially Implemented | 60% |
| PWA Configuration | Partially Implemented | 50% |
| Capacitor Integration | Configured | 40% |
| Authentication | Basic Implementation | 40% |
| Testing | Initial Setup | 20% |
| Documentation | In Progress | 60% |

**Overall Project Completion: ~70%**

## 🔜 Next Steps

To reach a full-scale production-ready application, the following steps are recommended:

### 1. Authentication Enhancements (2-3 days)
- Implement proper authentication flow with Supabase Auth
- Add user profiles and roles
- Secure admin routes

### 2. Offline Functionality (3-4 days)
- Implement robust offline queue for observations
- Add background sync capabilities
- Improve error handling for network transitions

### 3. PWA Optimization (2-3 days)
- Complete service worker implementation
- Add app manifest
- Implement install prompts
- Configure caching strategies

### 4. Capacitor Native Features (4-5 days)
- Integrate native camera API
- Add push notifications
- Implement deep linking
- Configure app icons and splash screens

### 5. Admin Dashboard Completion (3-4 days)
- Enhance data visualization
- Implement batch operations
- Add user management
- Complete export functionality

### 6. Testing (5-7 days)
- Implement unit tests
- Add integration tests
- Perform cross-browser testing
- Conduct mobile device testing

### 7. Performance Optimization (3-4 days)
- Optimize image processing
- Implement lazy loading
- Add caching strategies
- Reduce bundle size

### 8. Deployment and CI/CD (2-3 days)
- Set up CI/CD pipeline
- Configure staging and production environments
- Implement automated testing
- Set up monitoring and error tracking

### 9. Documentation and Training (2-3 days)
- Complete technical documentation
- Create user guides
- Prepare training materials
- Document API endpoints

### 10. Security Audit (2-3 days)
- Perform security assessment
- Implement recommended security measures
- Test for vulnerabilities
- Set up security monitoring

**Estimated Time to Production-Ready: 4-6 weeks**

## 🔧 Known Issues and Limitations

- Image upload may fail in certain network conditions
- Map performance can be slow with many markers
- Limited offline capabilities
- Admin dashboard needs additional security
- Mobile camera integration needs optimization

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Your Name - Initial work and development

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Capacitor](https://capacitorjs.com/)
