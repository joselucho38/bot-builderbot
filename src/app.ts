import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'

const PORT = process.env.PORT ?? 3008

/**
 * Helper to convert numbers to emojis
 */
const toEmoji = (n: number | string) => {
    const emojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
    return emojis[parseInt(n.toString())] || n.toString()
}

/**
 * Prevent crash on uncaught exceptions
 */
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception (handled):', err.message)
})
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled Rejection (handled):', reason)
})

import { BRANCHES, CATEGORIES, MENU, TOPPINGS_EXTRA, CUSTOM_INGREDIENTS } from './mock-data'

// --- FLOW: CUSTOMER DATA & PAYMENT ---

const paymentConfirmFlow = addKeyword<Provider, Database>(utils.setEvent('PAYMENT_CONFIRM_FLOW'))
    .addAnswer('🙌 ¡Muchas gracias por tu compra! Tu pedido está siendo procesado por la sede. ¡Disfrútalo! 😋')

const finalSummaryFlow = addKeyword<Provider, Database>(utils.setEvent('FINAL_SUMMARY_FLOW'))
    .addAnswer('✅ *¡DATOS RECIBIDOS!*')
    .addAction(async (_, { flowDynamic, state }) => {
        const cart = state.get('cart') || []
        const customer = state.get('customer') || {}
        const branch = state.get('branchName')
        const payment = state.get('payment') || {}
        
        let summary = `📑 *RESUMEN FINAL DE TU PEDIDO*\n\n`
        summary += `👤 *Cliente:* ${customer.name}\n`
        summary += `📞 *Teléfono:* ${customer.phone}\n`
        summary += `📍 *Dirección:* ${customer.address}\n`
        summary += `🏘️ *Barrio:* ${customer.neighborhood}\n`
        summary += `🪪 *Cédula:* ${customer.id}\n`
        summary += `📧 *Email:* ${customer.email}\n`
        summary += `\n🏬 *Sede:* ${branch}\n`
        
        summary += `💳 *Pago:* ${payment.method}\n`
        if (payment.method === 'Efectivo' && payment.changeFrom) {
            summary += `💵 *Pagas con:* $${payment.changeFrom}\n`
        }
        summary += `\n🛒 *Productos:* \n`
        let total = 0
        cart.forEach((item, i) => {
            summary += `${toEmoji(i + 1)} *${item.name}* ($${item.price})\n   _${item.description}_\n`
            total += item.price
        })
        summary += `\n💰 *TOTAL A PAGAR: $${total}*`
        
        await flowDynamic(summary)
        
        if (payment.method === 'Nequi') {
            await flowDynamic('📲 Por favor envía tu transferencia al Nequi: *3003414444* y envía el comprobante por este medio.')
        } else if (payment.method === 'Bancolombia') {
            await flowDynamic('🏦 Por favor envía tu transferencia a Bancolombia: *10145286411* y envía el comprobante por este medio.')
        }
    })
    .addAnswer('Escribe *LISTO* cuando hayas realizado el pago para procesar tu orden:', { capture: true }, async (ctx, { gotoFlow, state }) => {
        return gotoFlow(paymentConfirmFlow)
    })

const cashPaymentFlow = addKeyword<Provider, Database>(utils.setEvent('CASH_PAYMENT_FLOW'))
    .addAnswer('💵 ¿Con cuánto vas a pagar? (Escribe el valor del billete para enviarte el cambio exacto)', { capture: true }, async (ctx, { state, gotoFlow }) => {
        const payment = state.get('payment') || {}
        payment.changeFrom = ctx.body
        await state.update({ payment })
        return gotoFlow(finalSummaryFlow)
    })

const paymentMethodFlow = addKeyword<Provider, Database>(utils.setEvent('PAYMENT_METHOD_FLOW'))
    .addAnswer([
        '💳 *¿Cómo deseas pagar?*',
        `${toEmoji(1)} Nequi`,
        `${toEmoji(2)} Bancolombia`,
        `${toEmoji(3)} Efectivo`,
        '',
        `${toEmoji(0)} Volver a datos del cliente`
    ].join('\n'))
    .addAnswer('Selecciona una opción:', { capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
        const choice = ctx.body
        if (choice === '0') return gotoFlow(customerEmailFlow)
        if (choice === '1') {
            await state.update({ payment: { method: 'Nequi' } })
            return gotoFlow(finalSummaryFlow)
        } else if (choice === '2') {
            await state.update({ payment: { method: 'Bancolombia' } })
            return gotoFlow(finalSummaryFlow)
        } else if (choice === '3') {
            await state.update({ payment: { method: 'Efectivo' } })
            return gotoFlow(cashPaymentFlow)
        } else {
            return fallBack('Por favor selecciona 1, 2, 3 o 0.')
        }
    })

const customerEmailFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOMER_EMAIL_FLOW'))
    .addAnswer('📧 Por último, indícanos tu *correo electrónico*:', { capture: true }, async (ctx, { state, gotoFlow }) => {
        if (ctx.body === '0') return gotoFlow(customerIdFlow)
        const customer = state.get('customer') || {}
        customer.email = ctx.body
        await state.update({ customer })
        return gotoFlow(paymentMethodFlow)
    })

const customerIdFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOMER_ID_FLOW'))
    .addAnswer('🪪 Indícanos tu número de *Cédula/ID*:', { capture: true }, async (ctx, { state, gotoFlow }) => {
        if (ctx.body === '0') return gotoFlow(customerNeighborhoodFlow)
        const customer = state.get('customer') || {}
        customer.id = ctx.body
        await state.update({ customer })
        return gotoFlow(customerEmailFlow)
    })

const customerNeighborhoodFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOMER_NEIGHBORHOOD_FLOW'))
    .addAnswer('🏘️ ¿Cuál es tu *barrio*?', { capture: true }, async (ctx, { state, gotoFlow }) => {
        if (ctx.body === '0') return gotoFlow(customerAddressFlow)
        const customer = state.get('customer') || {}
        customer.neighborhood = ctx.body
        await state.update({ customer })
        return gotoFlow(customerIdFlow)
    })

const customerAddressFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOMER_ADDRESS_FLOW'))
    .addAnswer('📍 ¿A qué *dirección* debemos enviar tu pedido?', { capture: true }, async (ctx, { state, gotoFlow }) => {
        if (ctx.body === '0') return gotoFlow(customerPhoneFlow)
        const customer = state.get('customer') || {}
        customer.address = ctx.body
        await state.update({ customer })
        return gotoFlow(customerNeighborhoodFlow)
    })

const customerPhoneFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOMER_PHONE_FLOW'))
    .addAnswer('📞 ¿Cuál es tu *número telefónico* de contacto?', { capture: true }, async (ctx, { state, gotoFlow }) => {
        if (ctx.body === '0') return gotoFlow(customerDataFlow)
        const customer = state.get('customer') || {}
        customer.phone = ctx.body
        await state.update({ customer })
        return gotoFlow(customerAddressFlow)
    })

const customerDataFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOMER_DATA_FLOW'))
    .addAnswer('🤝 ¡Excelente! Ahora capturaremos tus datos para el envío.')
    .addAnswer('👤 ¿Cuál es tu *nombre completo*?', { capture: true }, async (ctx, { state, gotoFlow }) => {
        await state.update({ customer: { name: ctx.body } })
        return gotoFlow(customerPhoneFlow)
    })

// --- FLOW: CUSTOMIZATION & PREDEFINED OPTIONS ---

const predefinedSauceFlow = addKeyword<Provider, Database>(utils.setEvent('PREDEFINED_SAUCE_FLOW'))
    .addAction(async (_, { flowDynamic, state }) => {
        const item = state.get('pendingItem')
        if (!item) return await flowDynamic('⚠️ Error de selección.')
        const options = ['Cheddar', 'Chipotle', 'Ninguno']
        const list = options.map((opt, i) => `${toEmoji(i + 1)} ${opt}`).join('\n')
        await flowDynamic(`Honey *Salsa/Aderezo*: Para tu *${item.name}*, elige una opción:\n\n${list}\n\n${toEmoji(0)} Volver\n\nSelecciona el número de tu opción:`)
    })
    .addAnswer(null, { capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
        if (ctx.body === '0') return gotoFlow(itemFlow)
        const options = ['Cheddar', 'Chipotle', 'Ninguno']
        const index = parseInt(ctx.body) - 1
        if (isNaN(index) || !options[index]) {
            return fallBack('Selecciona 1, 2, 3 o 0.')
        }
        
        const item = state.get('pendingItem')
        const sauce = options[index]
        const cart = state.get('cart') || []
        
        const finalItem = { 
            ...item, 
            description: `${item.description}, Salsa: ${sauce}` 
        }
        cart.push(finalItem)
        await state.update({ cart, pendingItem: null })
        return gotoFlow(addToCartFlow)
    })

const customFinishFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOM_FINISH_FLOW'))
    .addAction(async (_, { flowDynamic, state }) => {
        const type = state.get('customType')
        if (!type) return await flowDynamic('⚠️ Error de estado.')
        const options = [...CUSTOM_INGREDIENTS[type].exterior, 'Ninguno']
        const list = options.map((opt, i) => `${toEmoji(i + 1)} ${opt}`).join('\n')
        await flowDynamic(`✨ *Toque final*: Elige una opción:\n\n${list}\n\n${toEmoji(0)} Volver\n\nSelecciona el número:`)
    })
    .addAnswer(null, { capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
        if (ctx.body === '0') return gotoFlow(customSauceFlow)
        const type = state.get('customType') as 'dulce' | 'salada'
        if (!type) return fallBack('⚠️ Error de sesión.')
        const options = [...CUSTOM_INGREDIENTS[type].exterior, 'Ninguno']
        const index = parseInt(ctx.body) - 1
        
        if (isNaN(index) || !options[index]) {
            return fallBack(`Elige un número válido o 0 para volver.`)
        }
        
        const selection = state.get('selection') || {}
        selection.finish = options[index]
        
        const cart = state.get('cart') || []
        const newItem = { 
            name: `Marquesita Personalizada (${type.toUpperCase()})`, 
            description: `Base: ${selection.base}, Frutas: ${selection.fruits}, Salsa: ${selection.sauce}, Toque: ${selection.finish}`,
            price: 10000 
        }
        cart.push(newItem)
        await state.update({ cart })
        return gotoFlow(addToCartFlow)
    })

const customSauceFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOM_SAUCE_FLOW'))
    .addAction(async (_, { flowDynamic, state }) => {
        const type = state.get('customType')
        if (!type) return await flowDynamic('⚠️ Error de estado.')
        const baseOptions = type === 'dulce' ? CUSTOM_INGREDIENTS.dulce.salsa : CUSTOM_INGREDIENTS.salada.aderezo
        const options = [...baseOptions, 'Ninguno']
        const list = options.map((opt, i) => `${toEmoji(i + 1)} ${opt}`).join('\n')
        await flowDynamic(`🍯 *Salsa/Aderezo*: Escoge una opción:\n\n${list}\n\n${toEmoji(0)} Volver\n\nSelecciona el número:`)
    })
    .addAnswer(null, { capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
        if (ctx.body === '0') return gotoFlow(customFruitFlow)
        const type = state.get('customType') as 'dulce' | 'salada'
        if (!type) return fallBack('⚠️ Error de sesión.')
        const baseOptions = type === 'dulce' ? CUSTOM_INGREDIENTS.dulce.salsa : CUSTOM_INGREDIENTS.salada.aderezo
        const options = [...baseOptions, 'Ninguno']
        const index = parseInt(ctx.body) - 1
        
        if (isNaN(index) || !options[index]) {
            return fallBack(`Elige un número válido o 0 para volver.`)
        }
        
        const selection = state.get('selection') || {}
        selection.sauce = options[index]
        
        if (type === 'salada') {
            const cart = state.get('cart') || []
            const newItem = { 
                name: `Marquesita Personalizada (${type.toUpperCase()})`, 
                description: `Base: ${selection.base}, Frutas: ${selection.fruits}, Salsa/Aderezo: ${selection.sauce}`,
                price: 10000 
            }
            cart.push(newItem)
            await state.update({ cart, selection: null, customType: null })
            return gotoFlow(addToCartFlow)
        }
        
        await state.update({ selection })
        return gotoFlow(customFinishFlow)
    })

const customFruitFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOM_FRUIT_FLOW'))
    .addAction(async (_, { flowDynamic, state }) => {
        const type = state.get('customType')
        if (!type) return await flowDynamic('⚠️ Error de estado.')
        const baseOptions = type === 'dulce' ? CUSTOM_INGREDIENTS.dulce.fruta : CUSTOM_INGREDIENTS.salada.fruta
        const options = [...baseOptions, 'Ninguno']
        const list = options.map((opt, i) => `${toEmoji(i + 1)} ${opt}`).join('\n')
        await flowDynamic(`🍓 *Frutas*: Elige hasta *2* (ej: 1,2) o "Ninguno":\n\n${list}\n\n${toEmoji(0)} Volver\n\nEscribe los números de tu selección:`)
    })
    .addAnswer(null, { capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
        if (ctx.body === '0') return gotoFlow(customBaseFlow)
        const type = state.get('customType') as 'dulce' | 'salada'
        if (!type) return fallBack('⚠️ Error de sesión.')
        const baseOptions = type === 'dulce' ? CUSTOM_INGREDIENTS.dulce.fruta : CUSTOM_INGREDIENTS.salada.fruta
        const options = [...baseOptions, 'Ninguno']
        
        const rawInput = ctx.body.replace(/\s+/g, ',').replace(/,+/g, ',')
        const indexes = rawInput.split(',').filter(idx => idx.trim() !== '').map(idx => parseInt(idx.trim()) - 1)
        
        if (indexes.length === 0) return fallBack(`Elige al menos una opción o 0 para volver.`)
        if (indexes.length > 2) return fallBack('Máximo 2 opciones, por favor.')
        
        const validSelections = []
        for (const idx of indexes) {
            if (isNaN(idx) || !options[idx]) {
                return fallBack(`Número "${idx + 1}" no válido. Elige entre 1 y ${options.length}.`)
            }
            validSelections.push(options[idx])
        }
        
        const selection = state.get('selection') || {}
        selection.fruits = validSelections.join(', ')
        await state.update({ selection })
        return gotoFlow(customSauceFlow)
    })

const customBaseFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOM_BASE_FLOW'))
    .addAction(async (_, { flowDynamic, state }) => {
        const type = state.get('customType')
        if (!type) return await flowDynamic('⚠️ Error de estado.')
        const options = CUSTOM_INGREDIENTS[type].base
        const list = options.map((opt, i) => `${toEmoji(i + 1)} ${opt}`).join('\n')
        await flowDynamic(`🍦 *Base (Elige 1)*:\n\n${list}\n\n${toEmoji(0)} Volver al inicio\n\nSelecciona el número de tu base:`)
    })
    .addAnswer(null, { capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
        if (ctx.body === '0') return gotoFlow(customOrderFlow)
        const type = state.get('customType') as 'dulce' | 'salada'
        if (!type) return fallBack('⚠️ Error de sesión.')
        const options = CUSTOM_INGREDIENTS[type].base
        const index = parseInt(ctx.body) - 1
        
        if (isNaN(index) || !options[index]) {
            return fallBack(`Elige un número válido o 0 para volver.`)
        }
        
        await state.update({ selection: { base: options[index] } })
        return gotoFlow(customFruitFlow)
    })

// --- FLOW: CATEGORY & ITEMS ---

const modificationMenuFlow = addKeyword<Provider, Database>(utils.setEvent('MODIFICATION_MENU_FLOW'))
    .addAnswer([
        '🛠 *Opciones de modificación:*',
        `${toEmoji(1)} Eliminar último producto`,
        `${toEmoji(2)} Vaciar carrito y empezar de nuevo`,
        `${toEmoji(3)} Volver a las categorías`,
        `${toEmoji(4)} Ver resumen actual`,
        '',
        'Selecciona una opción:'
    ].join('\n'), { capture: true }, async (ctx, { state, gotoFlow, flowDynamic, fallBack }) => {
        const choice = ctx.body
        const cart = state.get('cart') || []
        
        if (choice === '1') {
            cart.pop()
            await state.update({ cart })
            await flowDynamic('🗑 Se ha eliminado el último producto.')
            return gotoFlow(confirmationFlow)
        } else if (choice === '2') {
            await state.update({ cart: [] })
            await flowDynamic('🧹 Carrito vaciado.')
            return gotoFlow(categoryFlow)
        } else if (choice === '3') {
            return gotoFlow(categoryFlow)
        } else if (choice === '4') {
            return gotoFlow(confirmationFlow)
        } else {
            return fallBack('Selecciona una opción válida (1-4).')
        }
    })

const confirmationFlow = addKeyword<Provider, Database>(utils.setEvent('CONFIRMATION_FLOW'))
    .addAction(async (_, { flowDynamic, state }) => {
        const cart = state.get('cart') || []
        const branch = state.get('branchName')
        
        if (cart.length === 0) {
            await flowDynamic('Tu carrito está vacío.')
            return
        }

        let summary = `📝 *RESUMEN DE TU PEDIDO:* \n📍 Sede: *${branch}*\n\n`
        let total = 0
        cart.forEach((item, i) => {
            summary += `${toEmoji(i + 1)} *${item.name}* ($${item.price})\n   _Detalle: ${item.description}_\n`
            total += item.price
        })
        summary += `\n💰 *TOTAL PRODUCTOS: $${total}*`
        summary += `\n\n¿Es correcto el pedido? \n${toEmoji(1)} Sí, es correcto \n${toEmoji(2)} No, modificar pedido\n\nSelecciona el número de tu respuesta:`
        
        await flowDynamic(summary)
    })
    .addAnswer(null, { capture: true }, async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
        const choice = ctx.body
        if (choice === '1') {
            return gotoFlow(customerDataFlow)
        } else if (choice === '2') {
            return gotoFlow(modificationMenuFlow)
        } else {
            return fallBack('Por favor selecciona 1 o 2.')
        }
    })

const addToCartFlow = addKeyword<Provider, Database>(utils.setEvent('ADD_TO_CART_FLOW'))
    .addAnswer('🛒 *Producto añadido al carrito.*')
    .addAnswer([
        '¿Deseas agregar otro producto?',
        `${toEmoji(1)} Sí, agregar más`,
        `${toEmoji(2)} No, finalizar pedido`,
        '',
        `${toEmoji(0)} Volver a categorías`,
        '',
        'Selecciona el número:'
    ].join('\n'), { capture: true }, async (ctx, { gotoFlow, state, fallBack }) => {
        const choice = ctx.body
        if (choice === '0') return gotoFlow(categoryFlow)
        if (choice === '1' || choice.toLowerCase().includes('si')) {
            return gotoFlow(categoryFlow)
        } else if (choice === '2' || choice.toLowerCase().includes('no')) {
            return gotoFlow(confirmationFlow)
        } else {
            return fallBack('Selecciona 1, 2 o 0.')
        }
    })

const customOrderFlow = addKeyword<Provider, Database>(utils.setEvent('CUSTOM_ORDER_FLOW'))
    .addAnswer([
        '🎨 *ARMA TU MARQUESITA*',
        '',
        'Paso 1: Selecciona el tipo:',
        `${toEmoji(1)} Dulce`,
        `${toEmoji(2)} Salada`,
        '',
        `${toEmoji(0)} Volver a categorías`,
        '',
        'Selecciona el número:'
    ].join('\n'), { capture: true }, async (ctx, { state, fallBack, gotoFlow }) => {
        const choice = ctx.body
        if (choice === '0') return gotoFlow(categoryFlow)
        if (choice === '1') {
            await state.update({ customType: 'dulce' })
            return gotoFlow(customBaseFlow)
        } else if (choice === '2') {
            await state.update({ customType: 'salada' })
            return gotoFlow(customBaseFlow)
        } else {
            return fallBack('Responde con 1, 2 o 0.')
        }
    })

const itemFlow = addKeyword<Provider, Database>(utils.setEvent('ITEM_FLOW'))
    .addAction(async (_, { flowDynamic, state }) => {
        const category = state.get('category')
        if (!category || !MENU[category]) {
            return await flowDynamic('⚠️ Error de selección.')
        }
        const items = MENU[category]
        const itemList = items.map((item, i) => `${toEmoji(i + 1)} *${item.name}*\n   _Trae: ${item.description}_\n   Precio: $${item.price}`).join('\n\n')
        await flowDynamic(`Has seleccionado *${category}*.\n\n${itemList}\n\n${toEmoji(0)} Volver a categorías\n\nSelecciona el número de la opción que deseas:`)
    })
    .addAnswer(null, { capture: true }, async (ctx, { state, fallBack, gotoFlow }) => {
        if (ctx.body === '0') return gotoFlow(categoryFlow)
        const category = state.get('category')
        if (!category || !MENU[category]) return fallBack('⚠️ Error de categoría.')
        const items = MENU[category]
        const index = parseInt(ctx.body) - 1
        if (isNaN(index) || !items[index]) {
            return fallBack(`Selecciona un número válido o 0 para volver.`)
        }
        
        if (category === 'Marquesita Salada ($10.000)') {
            await state.update({ pendingItem: items[index] })
            return gotoFlow(predefinedSauceFlow)
        }
        
        const cart = state.get('cart') || []
        cart.push(items[index])
        await state.update({ cart })
        return gotoFlow(addToCartFlow)
    })

const categoryFlow = addKeyword<Provider, Database>(utils.setEvent('CATEGORY_FLOW'))
    .addAction(async (_, { flowDynamic, state }) => {
        const cart = state.get('cart') || []
        const message = cart.length === 0 
            ? '😋 ¡Excelente! ¿Qué tipo de Marquesita te apetece hoy?' 
            : '🛒 ¡Perfecto! ¿Qué más te gustaría añadir a tu pedido?'
        
        const catList = CATEGORIES.map((cat, i) => `${toEmoji(i + 1)} *${cat}*`).join('\n')
        await flowDynamic(`${message}\n\n${catList}\n\nSelecciona el número de la categoría:`)
    })
    .addAnswer(null, { capture: true }, async (ctx, { state, fallBack, gotoFlow }) => {
        const index = parseInt(ctx.body) - 1
        if (isNaN(index) || !CATEGORIES[index]) {
            return fallBack('Selecciona una categoría válida.')
        }
        const category = CATEGORIES[index]
        await state.update({ category })
        
        if (category === 'Armar mi propia Marquesita') {
            return gotoFlow(customOrderFlow)
        }
        return gotoFlow(itemFlow)
    })

const triageFlow = addKeyword<Provider, Database>(utils.setEvent('TRIAGE_FLOW'))
    .addAnswer('📍 Para asignarte la sede más cercana, dime en qué zona te encuentras:', { delay: 1000 })
    .addAction(async (_, { flowDynamic }) => {
        const zones = BRANCHES.map((b, i) => `${toEmoji(i + 1)} *${b.name}* (Zonas: ${b.zones.join(', ')})`).join('\n')
        await flowDynamic(`Aquí tienes nuestras sedes:\n\n${zones}\n\nSelecciona el número de tu sede:`)
    })
    .addAnswer(null, { capture: true }, async (ctx, { state, fallBack, gotoFlow }) => {
        const index = parseInt(ctx.body) - 1
        if (isNaN(index) || !BRANCHES[index]) {
            return fallBack('Por favor, selecciona una opción válida.')
        }
        await state.update({ branchId: BRANCHES[index].id, branchName: BRANCHES[index].name, cart: [] })
        return gotoFlow(categoryFlow)
    })

const welcomeFlow = addKeyword<Provider, Database>(['hola', 'buenas', 'pedir', 'menu'])
    .addAnswer('🙌 ¡Hola! Bienvenido a **Las Marquesitas djt**.', { delay: 500 })
    .addAnswer('Soy tu asistente virtual y te ayudaré con tu pedido hoy.', { delay: 1000 })
    .addAction(async (ctx, { gotoFlow, state }) => {
        await state.update({ phone: ctx.from, cart: [], customer: {}, payment: {} })
        return gotoFlow(triageFlow)
    })

const main = async () => {
    const adapterFlow = createFlow([
        welcomeFlow, triageFlow, categoryFlow, itemFlow, customOrderFlow, 
        customBaseFlow, customFruitFlow, customSauceFlow, customFinishFlow, 
        addToCartFlow, confirmationFlow, modificationMenuFlow, customerDataFlow, 
        customerPhoneFlow, customerAddressFlow, customerIdFlow, customerEmailFlow, 
        paymentMethodFlow, cashPaymentFlow, predefinedSauceFlow, finalSummaryFlow, 
        paymentConfirmFlow
    ])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    httpServer(+PORT)
}

main()
