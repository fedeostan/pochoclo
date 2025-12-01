# POCHOCLO

Una aplicación móvil de bienestar digital diseñada para ayudar a personas que luchan contra el abuso de redes sociales. POCHOCLO reemplaza el hábito negativo del "doomscrolling" con contenido educativo personalizado generado por inteligencia artificial.

## El Problema

Millones de personas pasan horas haciendo scroll infinito en redes sociales sin obtener ningún valor real. Este "tiempo muerto" se convierte en un hábito difícil de romper que afecta la productividad, el bienestar mental y la calidad de vida.

## La Solución

POCHOCLO transforma ese tiempo perdido en oportunidades de aprendizaje. En lugar de consumir contenido aleatorio y adictivo, los usuarios reciben artículos personalizados sobre temas que realmente les interesan, adaptados exactamente al tiempo que tienen disponible.

## Cómo Funciona

### 1. Onboarding Personalizado

Cuando un usuario se registra, completa un breve proceso de configuración:

- **Categorías de interés**: Selecciona los temas que le apasionan (tecnología, ciencia, negocios, salud, arte, historia, psicología, finanzas, idiomas, filosofía, medio ambiente, política, diseño, o categorías personalizadas)
- **Tiempo disponible**: Indica cuántos minutos de "tiempo muerto" tiene al día (5, 10, 15, 30 minutos o un valor personalizado)

### 2. Generación de Contenido con IA

Desde la pantalla principal, el usuario presiona "Crear contenido" y el sistema:

1. Envía las preferencias del usuario a un workflow de n8n
2. n8n procesa la solicitud y llama a Claude (IA de Anthropic)
3. Claude busca información actualizada en internet sobre las categorías del usuario
4. Genera un artículo en formato limpio y fácil de leer
5. El contenido aparece automáticamente en la app

### 3. Sistema de Memoria Inteligente

La aplicación **nunca muestra el mismo contenido dos veces**. Mantiene un historial de todos los artículos generados y lo envía con cada nueva solicitud para garantizar variedad constante.

### 4. Alertas para Crear Hábitos

Los usuarios pueden configurar recordatorios diarios a una hora específica. Estas notificaciones les recuerdan que es momento de aprender algo nuevo en lugar de abrir redes sociales.

### 5. Guardar y Revisar

Los artículos favoritos se pueden guardar para leer después. La sección "Guardados" permite acceder rápidamente al contenido que el usuario quiere conservar.

## Funcionalidades

| Funcionalidad | Descripción |
|---------------|-------------|
| **Autenticación** | Registro e inicio de sesión con email y contraseña |
| **Onboarding** | Configuración inicial de categorías y tiempo disponible |
| **Generación IA** | Contenido personalizado creado por Claude API |
| **Anti-repetición** | Historial que garantiza contenido siempre nuevo |
| **Alertas diarias** | Notificaciones locales para crear hábitos |
| **Guardar artículos** | Bookmark de contenido favorito |
| **Foto de perfil** | Selfie o imagen de galería |
| **Artículos recientes** | Acceso rápido a los últimos 3 artículos leídos |
| **Internacionalización** | Soporte para inglés y español |

## Stack Tecnológico

### Frontend
- **React Native** - Framework para desarrollo móvil multiplataforma
- **Expo** - Herramientas y servicios para React Native
- **TypeScript** - JavaScript con tipado estático
- **NativeWind** - Tailwind CSS para React Native
- **Redux Toolkit** - Gestión de estado global

### Backend
- **Firebase Authentication** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Storage** - Almacenamiento de imágenes (avatares)
- **n8n** - Automatización de workflows
- **Claude API** - Generación de contenido con IA

### Servicios Adicionales
- **Expo Notifications** - Notificaciones locales programadas
- **Expo Image Picker** - Captura de fotos (cámara/galería)

## Estructura del Proyecto

```
POCHOCLO/
├── app/                          # Pantallas (Expo Router)
│   ├── (auth)/                   # Flujo de autenticación
│   │   ├── welcome.tsx           # Pantalla de bienvenida
│   │   ├── sign-in.tsx           # Inicio de sesión
│   │   ├── sign-up.tsx           # Registro
│   │   └── onboarding/           # Configuración inicial
│   │       ├── category-selection.tsx
│   │       └── time-selection.tsx
│   └── (app)/                    # App principal (autenticado)
│       ├── home.tsx              # Pantalla principal
│       ├── saved.tsx             # Artículos guardados
│       └── profile.tsx           # Perfil y configuración
│
├── components/                   # Componentes reutilizables
│   └── ui/                       # Sistema de diseño
│
├── services/                     # Lógica de negocio
│   ├── firebase.ts               # Configuración Firebase
│   ├── n8n.ts                    # Integración con n8n
│   ├── savedContent.ts           # Gestión de guardados
│   ├── contentHistory.ts         # Historial anti-repetición
│   └── notifications.ts          # Alertas locales
│
├── store/                        # Redux state management
│   └── slices/
│       ├── authSlice.ts
│       ├── contentSlice.ts
│       └── userPreferencesSlice.ts
│
├── hooks/                        # Hooks personalizados
├── contexts/                     # Contextos de React
├── types/                        # Definiciones TypeScript
└── constants/                    # Constantes y configuración
```

## Instalación

### Prerrequisitos

- Node.js v18 o superior
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Emulador iOS (Xcode) o Android (Android Studio)

### Pasos

1. Clonar el repositorio
```bash
git clone https://github.com/fedeostan/pochoclo.git
cd pochoclo
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con las credenciales:
```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# n8n
EXPO_PUBLIC_N8N_WEBHOOK_URL=
```

4. Iniciar el servidor de desarrollo
```bash
npm start
```

5. Ejecutar en emulador
- Presionar `i` para iOS
- Presionar `a` para Android

## Configuración de Servicios Externos

### Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication con Email/Password
3. Crear base de datos Firestore
4. Configurar Storage para imágenes
5. Copiar credenciales al archivo `.env`

### n8n + Claude

1. Configurar instancia de n8n (self-hosted o cloud)
2. Crear workflow con webhook trigger
3. Integrar Claude API para generación de contenido
4. Configurar escritura a Firestore
5. Copiar URL del webhook al archivo `.env`

## Arquitectura de Generación de Contenido

```
┌──────────────┐     POST      ┌──────────────┐
│   App        │ ──────────────► │   n8n        │
│   (Redux)    │   webhook     │   Workflow   │
└──────────────┘               └──────┬───────┘
       │                              │
       │                              ▼
       │                       ┌──────────────┐
       │                       │   Claude     │
       │                       │   API        │
       │                       └──────┬───────┘
       │                              │
       │                              ▼
       │                       ┌──────────────┐
       │  Real-time listener   │   Firestore  │
       │◄──────────────────────┤   Database   │
       │                       └──────────────┘
       ▼
┌──────────────┐
│   UI Update  │
│   (Content)  │
└──────────────┘
```

## Modelo de Datos (Firestore)

```
users/{userId}/
├── preferences           # Configuración del usuario
│   ├── categories[]
│   ├── dailyLearningMinutes
│   ├── notifications { enabled, time }
│   └── onboardingCompleted
│
├── generatedContent/     # Contenido generado por IA
│   └── {requestId}
│       ├── status
│       ├── content { title, summary, body, sources }
│       └── generatedAt
│
├── contentHistory/       # Historial anti-repetición
│   └── {historyId}
│       ├── topicSummary
│       ├── category
│       └── generatedAt
│
├── savedContent/         # Artículos guardados
│   └── {requestId}
│       ├── content
│       └── savedAt
│
└── recentArticles/       # Últimos 3 leídos
    └── {docId}
        ├── contentBody
        └── readAt
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run android` | Ejecuta en emulador Android |
| `npm run ios` | Ejecuta en simulador iOS |
| `npm run build:android` | Genera build de Android |
| `npm run build:ios` | Genera build de iOS |

## Licencia

Proyecto de aprendizaje - uso libre para fines educativos.

---

POCHOCLO: Transforma tu tiempo perdido en conocimiento.
