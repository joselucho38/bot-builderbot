# 🍭 Las Marquesitas djt - WhatsApp Bot

Este proyecto es un chatbot automatizado desarrollado con [Builderbot](https://builderbot.app/) para gestionar pedidos de la franquicia **Las Marquesitas djt**. El bot guía a los clientes a través de un proceso intuitivo de selección, personalización y pago por medio de WhatsApp.

## 🚀 Características principales

- **Gestión Multi-sede (Triage)**: Identifica la zona del usuario y lo asigna a la sede correspondiente (ej. Floridablanca, El Porvenir, Cañaveral).
- **Personalización Completa**: Permite armar marquesitas dulces o saladas paso a paso (base, frutas, salsas y toppings).
- **Carrito de Compras**: Resumen de pedido con conversión de números a emojis para mejor legibilidad.
- **Múltiples Métodos de Pago**: Configurado para recibir comprobantes de Nequi y Bancolombia, o gestionar cambios para pago en efectivo.
- **Validación de Datos**: Captura segura de información del cliente (teléfono, ID, dirección, email).

## 🛠️ Tecnologías

- **Core**: [Builderbot](https://builderbot.app/)
- **Provider**: Baileys (WhatsApp)
- **Base de Datos**: In-memory (MemoryDB)
- **Lenguaje**: TypeScript
- **Entorno**: Node.js v20+

## ⚙️ Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/joselucho38/bot-builderbot.git
   cd bot-builderbot
   ```

2. Instala las dependencias:
   ```bash
   pnpm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```

4. Escanea el código QR generado en la terminal (o visualiza `bot.qr.png`) con tu WhatsApp.

## 📁 Estructura del Proyecto

```
src/
├── app.ts          # Orquestador de flujos y configuración del bot
└── mock-data.ts    # Datos de sedes, categorías, menú e ingredientes
```

## 📝 Flujo de Conversación

1. **Saludo**: Identificación del cliente.
2. **Ubicación**: Selección de zona/sede.
3. **Menú**: Navegación por categorías de marquesitas.
4. **Customización**: Selección de ingredientes extras.
5. **Confirmación**: Resumen detallado del pedido y total.
6. **Datos de Envío**: Recolección de dirección y contacto.
7. **Pago**: Instrucciones de transferencia o efectivo.
8. **Finalización**: Confirmación de procesamiento por la sede.

## 👨‍💻 Autor

- **Jose Luis Jimenez** (joselucho38@gmail.com)

---
*Este bot es parte del ecosistema SaaS de Las Marquesitas djt.*