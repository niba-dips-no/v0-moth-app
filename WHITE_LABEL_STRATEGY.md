# White-Label Citizen Science App Strategy

A comprehensive plan for transforming Målerjakt into a multi-tenant, white-label platform for various citizen science projects.

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
4. [Configuration System](#configuration-system)
5. [Data Isolation](#data-isolation)
6. [Deployment Strategy](#deployment-strategy)
7. [Branding & Theming](#branding--theming)
8. [Content Management](#content-management)
9. [Administration](#administration)
10. [Technical Implementation](#technical-implementation)
11. [Development Workflow](#development-workflow)
12. [Pricing & Business Model](#pricing--business-model)
13. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

Transform the Målerjakt moth tracking app into a flexible, white-label platform that can serve multiple citizen science projects (arctic foxes, bees, birds, etc.) while maintaining a single codebase and infrastructure.

### Key Benefits
- **Single codebase** for all clients
- **Isolated data** per client/project
- **Customizable branding** and content
- **Scalable infrastructure**
- **Reduced maintenance overhead**
- **Faster time-to-market** for new projects

### Target Use Cases
- **Wildlife tracking** (arctic foxes, wolves, bears)
- **Pollinator monitoring** (bees, butterflies)
- **Bird watching** projects
- **Plant phenology** studies
- **Marine life** observations
- **Environmental monitoring**

---

## Architecture Overview

### Current State
\`\`\`
Single App (Målerjakt)
├── Static configuration
├── Single database
├── Fixed branding
└── Norwegian/English only
\`\`\`

### Target State
\`\`\`
White-Label Platform
├── Multi-tenant architecture
├── Dynamic configuration
├── Tenant-specific databases/schemas
├── Customizable branding
├── Flexible content management
└── Multi-language support
\`\`\`

---

## Multi-Tenancy Strategy

### Option 1: Database Per Tenant (Recommended)
Each client gets their own Supabase project/database.

**Pros:**
- Complete data isolation
- Independent scaling
- Client-specific backups
- Easier compliance (GDPR, etc.)
- No risk of data leaks

**Cons:**
- Higher infrastructure costs
- More complex deployment
- Separate admin for each database

### Option 2: Schema Per Tenant
Single database with tenant-specific schemas.

**Pros:**
- Lower infrastructure costs
- Centralized management
- Shared resources

**Cons:**
- Complex RLS policies
- Risk of data leaks
- Harder to scale individually

### Option 3: Row-Level Security (RLS)
Single database with tenant_id in all tables.

**Pros:**
- Simplest to implement
- Lowest cost
- Easy to manage

**Cons:**
- Highest risk of data leaks
- Complex queries
- Shared resource limits

### **Recommended Approach: Database Per Tenant**

\`\`\`typescript
// Tenant configuration
interface TenantConfig {
  id: string
  name: string
  domain: string
  supabaseUrl: string
  supabaseAnonKey: string
  theme: ThemeConfig
  content: ContentConfig
  features: FeatureFlags
}
\`\`\`

---

## Configuration System

### Environment-Based Configuration

\`\`\`typescript
// config/tenant.ts
export interface TenantConfig {
  // Basic Info
  id: string
  name: string
  domain: string
  
  // Database
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  
  // Branding
  theme: {
    primaryColor: string
    secondaryColor: string
    logo: string
    favicon: string
    appName: string
  }
  
  // Content
  content: {
    species: {
      name: string
      description: string
      identificationGuide: string
    }
    project: {
      title: string
      description: string
      sponsors: string[]
      contactInfo: ContactInfo
    }
  }
  
  // Features
  features: {
    enableMap: boolean
    enableHistory: boolean
    enableNewsletter: boolean
    enableOfflineMode: boolean
    requireGeolocation: boolean
  }
  
  // Languages
  supportedLanguages: string[]
  defaultLanguage: string
}
\`\`\`

### Configuration Loading

\`\`\`typescript
// lib/config.ts
export function getTenantConfig(): TenantConfig {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID
  
  if (!tenantId) {
    throw new Error('TENANT_ID not configured')
  }
  
  // Load from environment variables or config file
  return {
    id: tenantId,
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Citizen Science App',
    domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // ... rest of config
  }
}
\`\`\`

---

## Data Isolation

### Database Structure Per Tenant

Each tenant gets their own Supabase project with identical schema:

\`\`\`sql
-- Standard schema for all tenants
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  comment TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL,
  device_info JSONB,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  name TEXT
);

-- Tenant-specific configuration table
CREATE TABLE tenant_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Storage Buckets Per Tenant

\`\`\`typescript
// lib/storage.ts
export function getTenantStorageBucket(): string {
  const tenantId = getTenantConfig().id
  return `observations-${tenantId}`
}
\`\`\`

---

## Deployment Strategy

### Option 1: Vercel Projects Per Tenant (Recommended)

Each client gets their own Vercel project with tenant-specific environment variables.

\`\`\`bash
# Deploy script for new tenant
./scripts/deploy-tenant.sh arctic-foxes

# Creates:
# - New Vercel project: arctic-foxes-tracker
# - Environment variables for tenant
# - Custom domain setup
# - Supabase project creation
\`\`\`

### Option 2: Single Deployment with Domain Routing

Single Vercel deployment that routes based on domain.

\`\`\`typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  const tenantId = getTenantIdFromDomain(hostname)
  
  // Set tenant context
  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenantId)
  return response
}
\`\`\`

### Option 3: Subdomain-Based Routing

\`\`\`
malerjakt.citizenscience.app
arctic-foxes.citizenscience.app
bees.citizenscience.app
\`\`\`

---

## Branding & Theming

### Dynamic Theme System

\`\`\`typescript
// components/theme-provider.tsx
export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const config = getTenantConfig()
  
  useEffect(() => {
    // Apply CSS custom properties
    document.documentElement.style.setProperty('--primary', config.theme.primaryColor)
    document.documentElement.style.setProperty('--secondary', config.theme.secondaryColor)
    
    // Update favicon and title
    document.title = config.theme.appName
    updateFavicon(config.theme.favicon)
  }, [config])
  
  return <ThemeProvider>{children}</ThemeProvider>
}
\`\`\`

### CSS Custom Properties

\`\`\`css
/* globals.css */
:root {
  /* Default values */
  --primary: 34 197 94; /* green-500 */
  --secondary: 168 85 247; /* purple-500 */
  
  /* Overridden by tenant config */
  --tenant-primary: var(--primary);
  --tenant-secondary: var(--secondary);
}

.bg-primary {
  background-color: hsl(var(--tenant-primary));
}
\`\`\`

### Logo and Asset Management

\`\`\`typescript
// components/tenant-logo.tsx
export function TenantLogo({ className }: { className?: string }) {
  const config = getTenantConfig()
  
  return (
    <img
      src={config.theme.logo || "/placeholder.svg"}
      alt={config.theme.appName}
      className={className}
    />
  )
}
\`\`\`

---

## Content Management

### Internationalization Per Tenant

\`\`\`typescript
// lib/translations.ts
export function getTenantTranslations(language: string) {
  const config = getTenantConfig()
  
  return {
    ...baseTranslations[language],
    ...config.content.translations[language],
    appName: config.theme.appName,
    species: config.content.species,
    project: config.content.project,
  }
}
\`\`\`

### Content Configuration

\`\`\`typescript
// Example: Arctic Fox configuration
const arcticFoxConfig: TenantConfig = {
  id: 'arctic-foxes',
  name: 'Arctic Fox Tracker',
  content: {
    species: {
      name: 'Arctic Fox',
      scientificName: 'Vulpes lagopus',
      description: 'Track arctic fox sightings in the wild...',
      identificationGuide: 'Look for small, compact foxes with...',
    },
    project: {
      title: 'Arctic Fox Conservation Project',
      description: 'Help us monitor arctic fox populations...',
      sponsors: ['WWF', 'Arctic Research Institute'],
      contactInfo: {
        email: 'contact@arcticfoxproject.org',
        website: 'https://arcticfoxproject.org'
      }
    }
  }
}
\`\`\`

---

## Administration

### Tenant-Specific Admin Access

\`\`\`typescript
// components/admin/tenant-admin.tsx
export function TenantAdminDashboard() {
  const config = getTenantConfig()
  const { user } = useAuth()
  
  // Only show data for current tenant
  const { data: observations } = useQuery(
    ['observations', config.id],
    () => fetchTenantObservations(config.id)
  )
  
  return (
    <div>
      <h1>{config.name} - Admin Dashboard</h1>
      {/* Tenant-specific admin interface */}
    </div>
  )
}
\`\`\`

### Super Admin Interface

\`\`\`typescript
// components/admin/super-admin.tsx
export function SuperAdminDashboard() {
  const { data: tenants } = useQuery('tenants', fetchAllTenants)
  
  return (
    <div>
      <h1>Platform Administration</h1>
      {tenants.map(tenant => (
        <TenantCard key={tenant.id} tenant={tenant} />
      ))}
    </div>
  )
}
\`\`\`

---

## Technical Implementation

### Project Structure

\`\`\`
src/
├── app/
│   ├── (tenant)/           # Tenant-specific pages
│   ├── admin/              # Admin interface
│   └── super-admin/        # Platform admin
├── components/
│   ├── tenant/             # Tenant-aware components
│   └── ui/                 # Base UI components
├── lib/
│   ├── config/             # Tenant configuration
│   ├── tenant/             # Tenant utilities
│   └── supabase/           # Database clients
└── config/
    ├── tenants/            # Tenant configurations
    └── base.ts             # Base configuration
\`\`\`

### Tenant Configuration Files

\`\`\`typescript
// config/tenants/malerjakt.ts
export const malerjaktConfig: TenantConfig = {
  id: 'malerjakt',
  name: 'Målerjakt',
  domain: 'malerjakt.no',
  theme: {
    primaryColor: '34 197 94', // green
    secondaryColor: '168 85 247', // purple
    logo: '/logos/malerjakt.png',
    appName: 'Målerjakt'
  },
  content: {
    species: {
      name: 'Moth',
      scientificName: 'Lepidoptera',
      description: 'Help us track moth populations...'
    }
  }
}

// config/tenants/arctic-foxes.ts
export const arcticFoxConfig: TenantConfig = {
  id: 'arctic-foxes',
  name: 'Arctic Fox Tracker',
  domain: 'arcticfox-tracker.org',
  theme: {
    primaryColor: '59 130 246', // blue
    secondaryColor: '239 68 68', // red
    logo: '/logos/arctic-fox.png',
    appName: 'Arctic Fox Tracker'
  },
  content: {
    species: {
      name: 'Arctic Fox',
      scientificName: 'Vulpes lagopus',
      description: 'Monitor arctic fox populations...'
    }
  }
}
\`\`\`

### Database Client Factory

\`\`\`typescript
// lib/supabase/tenant-client.ts
export function createTenantSupabaseClient(tenantId?: string) {
  const config = tenantId ? getTenantConfigById(tenantId) : getTenantConfig()
  
  return createClient(config.supabaseUrl, config.supabaseAnonKey)
}

// Usage
const supabase = createTenantSupabaseClient()
\`\`\`

---

## Development Workflow

### 1. Creating a New Tenant

\`\`\`bash
# Script: scripts/create-tenant.sh
#!/bin/bash

TENANT_ID=$1
TENANT_NAME=$2
DOMAIN=$3

echo "Creating new tenant: $TENANT_ID"

# 1. Create Supabase project
supabase projects create "$TENANT_NAME"

# 2. Set up database schema
supabase db push --project-ref $PROJECT_REF

# 3. Create tenant configuration
cat > "config/tenants/$TENANT_ID.ts" << EOF
export const ${TENANT_ID}Config: TenantConfig = {
  id: '$TENANT_ID',
  name: '$TENANT_NAME',
  domain: '$DOMAIN',
  // ... rest of config
}
EOF

# 4. Create Vercel project
vercel --name "$TENANT_ID-tracker"

# 5. Set environment variables
vercel env add NEXT_PUBLIC_TENANT_ID "$TENANT_ID"
vercel env add NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL"
# ... other env vars

echo "Tenant $TENANT_ID created successfully!"
\`\`\`

### 2. Development Environment

\`\`\`bash
# .env.local for development
NEXT_PUBLIC_TENANT_ID=malerjakt
NEXT_PUBLIC_SUPABASE_URL=https://malerjakt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Switch tenant for testing
npm run dev:tenant arctic-foxes
\`\`\`

### 3. Testing Multiple Tenants

\`\`\`typescript
// tests/tenant.test.ts
describe('Multi-tenant functionality', () => {
  test('loads correct configuration for each tenant', () => {
    process.env.NEXT_PUBLIC_TENANT_ID = 'malerjakt'
    const config1 = getTenantConfig()
    expect(config1.name).toBe('Målerjakt')
    
    process.env.NEXT_PUBLIC_TENANT_ID = 'arctic-foxes'
    const config2 = getTenantConfig()
    expect(config2.name).toBe('Arctic Fox Tracker')
  })
})
\`\`\`

---

## Pricing & Business Model

### Pricing Tiers

#### Starter ($99/month)
- Up to 1,000 observations/month
- Basic admin dashboard
- Email support
- Standard branding customization

#### Professional ($299/month)
- Up to 10,000 observations/month
- Advanced analytics
- Custom domain
- Priority support
- Full branding customization

#### Enterprise ($999/month)
- Unlimited observations
- Dedicated infrastructure
- Custom features
- SLA guarantee
- White-label licensing

### Revenue Streams

1. **Monthly subscriptions** per tenant
2. **Setup fees** for new tenants
3. **Custom development** for special features
4. **Data export** and analytics services
5. **Training and support** packages

---

## Implementation Roadmap

### Phase 1: Foundation (4-6 weeks)
- [ ] Multi-tenant configuration system
- [ ] Database per tenant setup
- [ ] Basic theme customization
- [ ] Tenant-aware routing
- [ ] Admin interface separation

### Phase 2: Content Management (3-4 weeks)
- [ ] Dynamic content system
- [ ] Species-specific configurations
- [ ] Multi-language per tenant
- [ ] Asset management system
- [ ] Content validation

### Phase 3: Deployment Automation (2-3 weeks)
- [ ] Tenant creation scripts
- [ ] Automated Vercel deployments
- [ ] Supabase project automation
- [ ] Environment management
- [ ] Monitoring setup

### Phase 4: Advanced Features (4-5 weeks)
- [ ] Advanced analytics per tenant
- [ ] Custom feature flags
- [ ] API access for tenants
- [ ] Data export tools
- [ ] Integration capabilities

### Phase 5: Platform Management (3-4 weeks)
- [ ] Super admin dashboard
- [ ] Billing integration
- [ ] Usage monitoring
- [ ] Performance optimization
- [ ] Security hardening

### Phase 6: Launch & Scale (2-3 weeks)
- [ ] Documentation
- [ ] Onboarding process
- [ ] Support system
- [ ] Marketing materials
- [ ] First pilot customers

**Total Estimated Time: 18-25 weeks**

---

## Success Metrics

### Technical Metrics
- **Deployment time** for new tenant: < 30 minutes
- **Code reuse**: > 95% shared codebase
- **Performance**: < 2s page load time
- **Uptime**: > 99.9% availability

### Business Metrics
- **Time to market** for new projects: < 1 week
- **Customer acquisition cost**: Reduced by 60%
- **Development efficiency**: 5x faster than custom builds
- **Customer satisfaction**: > 4.5/5 rating

---

## Risk Assessment

### Technical Risks
- **Data isolation failures**: Mitigated by database-per-tenant
- **Performance degradation**: Monitored and auto-scaled
- **Security vulnerabilities**: Regular audits and updates
- **Deployment complexity**: Automated scripts and monitoring

### Business Risks
- **Market demand uncertainty**: Start with pilot customers
- **Competition**: Focus on citizen science niche
- **Pricing pressure**: Flexible pricing tiers
- **Customer churn**: Strong onboarding and support

---

## Conclusion

The white-label transformation of Målerjakt presents a significant opportunity to scale the platform across multiple citizen science projects while maintaining a single, efficient codebase. The database-per-tenant approach provides the best balance of data isolation, security, and scalability.

Key success factors:
1. **Robust configuration system**
2. **Automated deployment processes**
3. **Strong data isolation**
4. **Flexible theming capabilities**
5. **Comprehensive admin tools**

With proper implementation, this platform could serve dozens of citizen science projects while reducing development costs and time-to-market significantly.
