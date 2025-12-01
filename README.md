# POCHOCLO - Proyecto de Aprendizaje React Native

Bienvenido a POCHOCLO! Esta es una aplicación móvil de descubrimiento de películas y series enfocada en el aprendizaje, diseñada para enseñarte desarrollo en React Native desde cero.

## Sobre la Aplicación

POCHOCLO es una app de entretenimiento que te ayuda a:
- Descubrir películas y series populares
- Obtener recomendaciones personalizadas basadas en tus gustos
- Guardar tu contenido favorito en watchlists
- Explorar por géneros, tendencias y más

## Propósito del Proyecto

Este es un **proyecto educativo** construido para ayudarte a aprender:
- **React Native**: Construir apps móviles usando React
- **TypeScript**: Escribir código JavaScript con tipado seguro
- **Expo**: Desarrollo simplificado de React Native
- **Firebase**: Servicios de backend (base de datos, autenticación, almacenamiento)
- **NativeWind**: Estilos con Tailwind CSS para React Native

Cada archivo en este proyecto contiene comentarios extensos explicando **por qué** y **cómo** funcionan las cosas, no solo qué hace el código.

## Qué Hace Este Proyecto Especial

- **Enfoque en la Enseñanza**: El código está muy comentado con explicaciones educativas
- **Aprendizaje Progresivo**: Comienza simple, añade complejidad mientras aprendes
- **Patrones del Mundo Real**: Aprende las mejores prácticas de la industria desde el inicio
- **Comentarios Completos**: Entiende el "por qué" detrás de cada decisión

## Stack Tecnológico

| Tecnología | Propósito | Por Qué la Usamos |
|------------|-----------|-------------------|
| **React Native** | Framework móvil | Escribe una vez, ejecuta en iOS y Android |
| **TypeScript** | Lenguaje | Detecta errores temprano con tipado seguro |
| **Expo** | Plataforma de desarrollo | Configuración simplificada, excelentes herramientas |
| **Firebase** | Servicio de backend | Base de datos, auth, almacenamiento sin manejar servidores |
| **NativeWind** | Estilos | Tailwind CSS para React Native |

## Estructura del Proyecto

```
POCHOCLO/
├── app/                    # Pantallas de la app (Expo Router)
│   ├── (tabs)/            # Navegación por pestañas
│   │   ├── index.tsx      # Pantalla de inicio (Home)
│   │   ├── discover.tsx   # Descubrir contenido
│   │   ├── watchlist.tsx  # Lista de seguimiento
│   │   └── profile.tsx    # Perfil del usuario
│   ├── (auth)/            # Pantallas de autenticación
│   │   ├── login.tsx      # Inicio de sesión
│   │   └── register.tsx   # Registro
│   └── (onboarding)/      # Flujo de onboarding
│
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI base
│   └── ...               # Componentes específicos
│
├── services/             # Lógica de negocio y APIs
│   ├── firebase.ts       # Configuración de Firebase
│   ├── tmdb.ts          # API de películas (TMDB)
│   └── content.ts       # Servicio de contenido
│
├── hooks/                # Hooks personalizados de React
├── contexts/             # Contextos de React (estado global)
├── types/                # Definiciones de tipos TypeScript
└── constants/            # Constantes y configuración
```

## Sistema de Diseño

**IMPORTANTE**: Toda la UI sigue el sistema de diseño definido en `UI_RULES.md`.

### Referencia Rápida

**Colores**
- Fondo: `bg-background` (#FAFAF9 - blanco cálido)
- Primario: `bg-primary` / `text-primary` (#6B8E7B - verde salvia suave)
- Texto: `text-foreground` (#1C1917 - gris oscuro)
- Atenuado: `text-muted-foreground` (#78716C)

**Principios Fundamentales**
- MINIMAL: Sin elementos innecesarios, abraza el espacio en blanco
- LIGERO: Solo tema claro, fondos blancos cálidos
- SUAVE: Colores atenuados, sin tonos vibrantes
- MODERNO: Esquinas redondeadas (12px), tipografía limpia

**Siempre Usa Componentes de UI**
```tsx
import { Button, Input, Text, Card } from "@/components/ui";

// NO usar primitivos de React Native directamente para elementos estilizados
```

## Comenzando

### Prerrequisitos

Antes de comenzar, asegúrate de tener:

1. **Node.js** (v18 o más reciente)
   - Descargar: https://nodejs.org/
   - Verificar versión: `node --version`

2. **npm** (viene con Node.js)
   - Verificar versión: `npm --version`

3. **Git** (para control de versiones)
   - Descargar: https://git-scm.com/
   - Verificar versión: `git --version`

4. **Emulador Móvil** (elige uno o ambos):
   - **Simulador iOS**: Solo macOS, requiere Xcode
   - **Android Studio**: Windows, macOS o Linux

### Pasos de Instalación

1. **Clona o navega a este proyecto**
   ```bash
   cd POCHOCLO
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```
   Esto descarga todos los paquetes necesarios (React Native, Expo, Firebase, etc.)

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Luego edita `.env` con tus credenciales de Firebase y TMDB

4. **Inicia el servidor de desarrollo**
   ```bash
   npm start
   ```
   Esto lanza Expo DevTools en tu navegador

## Ejecutando en Emuladores

### Opción 1: Simulador iOS (solo macOS)

1. **Instala Xcode** desde la Mac App Store
2. **Abre Xcode** al menos una vez para completar la configuración
3. **Ejecuta la app**:
   - Inicia el servidor: `npm start`
   - Presiona `i` en la terminal

### Opción 2: Emulador Android

1. **Instala Android Studio**
   - Descargar: https://developer.android.com/studio

2. **Configura un Android Virtual Device (AVD)**:
   - Abre Android Studio
   - Ve a Tools → Device Manager
   - Haz clic en "Create Device"
   - Elige un dispositivo (Pixel 5 recomendado)
   - Descarga una imagen del sistema (API 33+ recomendado)

3. **Ejecuta la app**:
   - Inicia el servidor: `npm start`
   - Presiona `a` en la terminal

### Opción 3: Dispositivo Físico

1. **Instala la app Expo Go** en tu teléfono:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Conéctate a la misma WiFi** que tu computadora

3. **Escanea el código QR** mostrado en la terminal o navegador

## Configuración de Firebase

### 1. Crea una Cuenta de Firebase

1. Ve a https://console.firebase.google.com
2. Regístrate (nivel gratuito disponible)
3. Crea un nuevo proyecto

### 2. Obtén tus Credenciales

1. En el dashboard de tu proyecto Firebase
2. Ve a Configuración del proyecto
3. Añade una app (Web, iOS o Android)
4. Copia los valores de configuración

### 3. Configura tu App

Añade tus credenciales a `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=tu-app-id
```

## Configuración de TMDB (API de Películas)

1. Crea una cuenta en https://www.themoviedb.org/
2. Ve a Configuración → API
3. Solicita una API key
4. Añade a `.env`:
```env
EXPO_PUBLIC_TMDB_API_KEY=tu-tmdb-api-key
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run android` | Ejecuta en emulador Android |
| `npm run ios` | Ejecuta en simulador iOS (solo macOS) |
| `npm run web` | Ejecuta en navegador web (experimental) |
| `npm test` | Ejecuta tests |

## Ruta de Aprendizaje

### Nivel 1: Comenzando
- Configura el entorno de desarrollo
- Ejecuta la app en un emulador
- Entiende la estructura del proyecto

### Nivel 2: Fundamentos de React Native
- Entiende componentes y JSX
- Aprende sobre estado con useState
- Estiliza componentes con NativeWind
- Maneja entrada de usuario y eventos

### Nivel 3: Integración con TypeScript
- Aprende los básicos de TypeScript
- Entiende las anotaciones de tipos
- Usa interfaces y tipos
- Detecta errores en tiempo de compilación

### Nivel 4: Navegación
- Usa Expo Router
- Crea múltiples pantallas
- Navega entre pantallas
- Pasa datos entre pantallas

### Nivel 5: Integración con Firebase
- Conéctate a Firebase
- Realiza operaciones CRUD con Firestore
- Añade autenticación de usuarios
- Maneja almacenamiento de archivos

### Nivel 6: Temas Avanzados
- Gestión de estado (Context API)
- Hooks personalizados
- Optimización de rendimiento
- Publicación en tiendas de apps

## Guía de Exploración del Código

Empieza leyendo estos archivos en orden:

1. **app/(tabs)/index.tsx** - Pantalla de inicio, componentes básicos
2. **services/firebase.ts** - Configuración del backend
3. **components/ui/** - Sistema de componentes reutilizables
4. **hooks/** - Hooks personalizados para lógica compartida
5. **CLAUDE.md** - Filosofía de enseñanza y estándares de código

## Conceptos Clave a Entender

### Componentes
Los componentes son los bloques de construcción de las apps React Native. Piensa en ellos como piezas reutilizables de UI.

### Estado (State)
El estado son datos que pueden cambiar con el tiempo. Cuando el estado cambia, React re-renderiza el componente.

### Props
Las props (propiedades) son cómo los componentes padre pasan datos a los componentes hijo.

### JSX
JSX es sintaxis que parece HTML pero en realidad es JavaScript. Describe cómo debería verse la UI.

### Tipos de TypeScript
Los tipos ayudan a detectar errores antes de ejecutar el código. Documentan qué tipo de datos se esperan.

## Solución de Problemas

### "Metro bundler no puede conectarse"
- Asegúrate de estar en la misma red WiFi
- Intenta reiniciar con: `npm start -- --reset-cache`

### "Unable to resolve module"
- Limpia caché y reinstala:
  ```bash
  rm -rf node_modules
  npm install
  npm start -- --reset-cache
  ```

### "Xcode not found"
- Instala Xcode desde la Mac App Store
- Ejecuta: `sudo xcode-select --switch /Applications/Xcode.app`

### Variables de entorno no funcionan
- Deben empezar con `EXPO_PUBLIC_`
- Reinicia el servidor de desarrollo después de cambiar .env
- Limpia caché: `npm start -- --reset-cache`

## Recursos de Aprendizaje

### Documentación Oficial
- **React Native**: https://reactnative.dev/
- **Expo**: https://docs.expo.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Firebase**: https://firebase.google.com/docs

### Tutoriales Recomendados
- Expo Getting Started: https://docs.expo.dev/get-started/introduction/
- React Native Basics: https://reactnative.dev/docs/tutorial
- TypeScript para Principiantes: https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html

### Comunidad
- React Native Discord: https://discord.gg/react-native-community
- Expo Discord: https://discord.gg/expo
- Stack Overflow: https://stackoverflow.com/questions/tagged/react-native

## Cómo Aprender Efectivamente

1. **Lee los comentarios**: Cada archivo tiene explicaciones detalladas
2. **Experimenta**: Intenta cambiar valores y ve qué pasa
3. **Rompe cosas**: No tengas miedo de romper la app - siempre puedes deshacer
4. **Haz preguntas**: Usa los comentarios para entender, luego pregunta si no está claro
5. **Construye incrementalmente**: Comienza pequeño, añade funciones una a la vez
6. **Usa Git**: Haz commit del código que funciona para poder volver atrás

## Próximos Pasos

Después de tener la app funcionando:

1. **Explora el código**: Lee a fondo las pantallas principales
2. **Haz cambios**: Intenta cambiar colores, texto o añadir un nuevo botón
3. **Crea un componente**: Haz tu primer componente reutilizable
4. **Personaliza tu perfil**: Añade géneros favoritos en el onboarding
5. **Explora Firebase**: Aprende cómo se guardan los datos de usuario

## Licencia

Este es un proyecto de aprendizaje - siéntete libre de usarlo, modificarlo y aprender de él!

## Estás Listo!

Ejecuta `npm start`, presiona `i` para iOS o `a` para Android, y comienza tu viaje en React Native!

Recuerda: **Todo experto fue una vez un principiante.** Tómate tu tiempo, lee los comentarios, experimenta, y lo más importante - diviértete aprendiendo!

---

**Preguntas o atascado?** Revisa primero los comentarios del código - están ahí para ayudarte a aprender!
