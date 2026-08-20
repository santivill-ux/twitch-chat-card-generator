# Twitch Chat Card Generator

Editor visual para crear tarjetas de chat inspiradas en Twitch y exportarlas como PNG transparente de alta resolución. Todo funciona localmente en el navegador: no requiere cuentas, backend ni transferencia de mensajes o badges.

## Demo

[Abrir Twitch Chat Card Generator en Vercel](https://twitch-chat-card-generator-santiago-gabriels-projects.vercel.app)

## Características

- Preview recortada de **Solo mensaje** y vista de **Canvas completo** en 1920×1080 o 1080×1920.
- Tarjetas frontal y trasera configurables: color, opacidad, padding, tamaño, bordes, sombras, offset, escala y radio.
- Nueve tipos de gradiente para la Back Card: Linear, Radial, Angular, Diamond, Mesh, Shape Blur, Freeform, Multiple y Aurora.
- Cuatro colores por gradiente, control de ángulo, presets y aleatorización.
- Paletas aleatorias coordinadas entre username y Back Card, con contraste seguro.
- Presets de estilo personalizados que se guardan localmente y pueden volver a aplicarse.
- Badges oficiales de Twitch, badge de TikTok y carga de badges personalizados PNG, WebP o SVG.
- Sanitización de SVG para bloquear scripts, eventos y recursos externos.
- Layout apilado e inline, wrapping automático, tamaño automático y advertencia de overflow.
- Roobert como tipografía predeterminada, con selector de fuentes y fallbacks seguros.
- Capas con selección, visibilidad, reordenamiento, duplicado y copiar/pegar estilos.
- Exportación PNG transparente a calidad máxima 4×.
- Once animaciones por mensaje: Typing, Pop In, Pop Out, Pop In + Out, Fade In/Out, Slide Up, Bounce, Pulse, Float y Shake.
- Exportación de la animación del mensaje seleccionado, recortada automáticamente, en MP4 o MOV a 30/60 FPS y hasta 2×.
- Fondos de preview blanco, negro, checkerboard, chroma, transparente o personalizado; nunca se exportan.
- Guardado automático local con recuperación segura y reset del proyecto.

## Stack

- React 19
- TypeScript
- Vite / vinext
- Tailwind CSS
- Konva y react-konva
- Vitest

## Requisitos

- Node.js 22.13 o superior
- npm

## Instalación local

```bash
git clone https://github.com/santivill-ux/twitch-chat-card-generator.git
cd twitch-chat-card-generator
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Scripts

```bash
npm run dev          # Servidor local
npm test             # Pruebas unitarias
npm run build        # Compilación de producción vinext
npm run vercel-build # Compilación estática para Vercel
```

## Uso

1. Escribe el nombre y el mensaje en la pestaña **Content**.
2. Personaliza Front Card, Back Card, tipografía y badges.
3. Usa **Solo mensaje** para revisar el recorte final o **Canvas completo** para posicionar capas.
4. Selecciona un fondo de preview para comprobar contraste. El fondo es únicamente visual.
5. Exporta el mensaje o el canvas como PNG transparente a 4×.
6. En **Animation**, elige un movimiento, ajusta duración, delay e intensidad, reproduce la preview y exporta MP4 o MOV.

## Tipografía Roobert

La aplicación está preparada para estas variantes:

```text
public/fonts/Roobert-Regular.woff2
public/fonts/Roobert-Medium.woff2
public/fonts/Roobert-SemiBold.woff2
public/fonts/Roobert-Bold.woff2
```

Los archivos de Roobert no se distribuyen en este repositorio. Añade copias con licencia en `public/fonts`. Si no están disponibles, la aplicación usa Inter, Arial y `sans-serif` como fallback.

## Privacidad y persistencia

- Los proyectos se guardan exclusivamente en `localStorage`.
- Los mensajes y badges personalizados no se envían a servicios externos.
- Si se supera la cuota del navegador, la sesión activa permanece disponible y se muestra una advertencia.

## Exportación

- Formato: PNG
- Fondo: transparente
- Calidad: 4×
- Full Canvas: 1920×1080 o 1080×1920
- Message Only: bounding box del mensaje seleccionado con padding configurable

Los fondos seleccionados en la preview son CSS y no forman parte del canvas exportado.

### Video animado

- Formatos: MP4 y MOV.
- Contenido: únicamente el mensaje seleccionado, recortado a su bounding box animado con padding configurable.
- Calidad: 1× o 2×; 30 o 60 FPS.
- Fondo: color sólido configurable e incluido en el video para máxima compatibilidad entre reproductores.
- Privacidad: la grabación y conversión se realizan localmente. En la primera exportación, el navegador descarga FFmpeg WebAssembly (aproximadamente 31 MB); los mensajes y badges no se envían a ningún servidor.

## Despliegue en Vercel

El repositorio incluye una compilación estática dedicada:

```bash
npm run vercel-build
```

Vercel usa `vercel.json` y publica el directorio `vercel-dist`.

Si el equipo utiliza Deployment Protection, desactiva **Vercel Authentication** para Production desde la configuración del proyecto antes de compartir la URL pública.

## Estructura principal

```text
app/                    Estilos globales y entrada vinext
components/             Editor y renderizado Konva
public/badges/           Badges visuales incluidos
public/fonts/            Instrucciones para Roobert
tests/                   Pruebas de layout y estado
types/                   Interfaces TypeScript
utils/                   Layout, presets, colores y persistencia
client.tsx               Entrada estática para Vercel
vite.vercel.config.ts    Build estático de Vercel
```

## Marcas y recursos

Twitch, TikTok y sus marcas pertenecen a sus respectivos propietarios. Esta herramienta no está afiliada ni respaldada oficialmente por Twitch o TikTok.
