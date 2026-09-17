# Notas del assessment

## Qué hice

Trabajé principalmente en `api/src/orders` y en las páginas de checkout y confirmación del frontend, siguiendo el patrón que ya traía el proyecto (Nest en el backend, useApiQuery/useApiMutation en el frontend).

En el backend completé las reglas de negocio que estaban dejadas a medias a propósito en orders.service.ts. Agregué el cálculo del cargo de servicio como el 10% del subtotal usando Math.round para no meter números flotantes, validé que la cantidad pedida no supere ni el remaining ni el maxPerOrder de cada tipo de entrada, hice que al crear la orden se descuente de verdad el inventario, rechacé que se repita el mismo ticketTypeId dentro del mismo pedido, y bloqueé que se pueda confirmar una orden que ya no está pending. Con esto los trece tests que traía el proyecto en orders.service.spec.ts quedaron pasando.

En el frontend armé el formulario de checkout con react-hook-form y Yup para validar nombre y correo, mostré el resumen de la compra con las líneas, el cargo de servicio y el total antes de pagar, y conecté el flujo real: se crea la orden, apenas se confirma la creación se dispara la confirmación con los datos del comprador, y se redirige a la pantalla de la orden. Si la API devuelve un error, ya sea porque se agotaron las entradas o porque algo no pasó la validación, ese mensaje se muestra directo en el formulario en vez de dejar la pantalla rota o en blanco.

De los extras que proponía el enunciado, alcancé a implementar el código de descuento SAVE10. Se valida en el backend contra una lista de códigos permitidos, calcula el 10% de descuento sobre el subtotal, y lo más importante, el cargo de servicio se calcula sobre el subtotal ya con el descuento aplicado, tal como pedía la instrucción, no sobre el subtotal original. En el frontend agregué el campo opcional en el formulario, lo mando solo al crear la orden y no al confirmar, y en la pantalla de confirmación se muestra la línea de descuento en verde solo cuando aplica.

Fui haciendo commits separados por cada regla o cada pieza que iba resolviendo, en vez de dejar todo en uno solo, para que se pueda seguir el razonamiento paso a paso revisando el historial.

## Qué no me alcanzó

De los tres extras que proponía el enunciado, me quedaron pendientes dos.

No implementé la reserva de quince minutos con liberación automática del inventario. La idea era que al crear una orden pending, el remaining quedara apartado solo por un tiempo limitado, y si nadie confirma dentro de ese plazo, se le devuelva el inventario al evento como si la orden nunca se hubiera hecho. Para hacerlo bien hacía falta guardar un expiresAt en la orden y correr algún mecanismo que revise órdenes vencidas, ya sea con un cron simple o revisando la expiración cada vez que se lee el store, y no llegué a diseñarlo con cuidado en el tiempo que tenía.

Tampoco cubrí el caso de que las entradas se agoten mientras alguien está en la pantalla de checkout con el resumen ya armado. Ah<br>Ahora mismo, si alguien entra al detalle del evento, selecciona cantidad, pasa al checkout, y en el medio otra persona agota esas mismas entradas, el error recién aparece cuando se intenta crear la orden y la API lo rechaza, lo cual funciona pero no es la mejor experiencia. Lo ideal hubiera sido refrescar la disponibilidad del evento en segundo plano mientras el usuario está en el checkout, y avisarle ahí mismo si algo cambió antes de que intente pagar.

Tampoco alcancé a escribir tests para el frontend. Los trece tests que pasan son todos del backend y ya venían armados en el proyecto, más los dos que agregué para el código de descuento. No llegué a cubrir CheckoutPage ni ConfirmationPage con Testing Library, por ejemplo para verificar que el formulario no deje enviar con campos vacíos o que el mensaje de error se muestre cuando la API responde 400.

Me quedaron también un par de comentarios TODO originales del proyecto sin borrar en algunos archivos del frontend, sobre todo en los bloques de JSDoc que traían las instrucciones de qué implementar en cada página. Ya implementé lo que pedían, pero no pasé una revisión final para eliminar ese texto y dejar el archivo limpio de esas anotaciones que ya no aportan nada una vez resuelta la funcionalidad.

## Qué haría distinto con más tiempo

Lo primero que haría es una pasada de refactorización sobre orders.service.ts aplicando principios de Clean Code y SOLID con más cuidado. El método create ahora mismo hace demasiadas cosas a la vez: valida la forma del request, busca el evento, valida cada línea contra el inventario, calcula el descuento, calcula el fee, arma el objeto de la orden y lo guarda en el store. Le sacaría responsabilidades a funciones más chicas y con un solo propósito cada una, algo como una función que solo valide los items sin tocar nada, otra que solo calcule los montos, otra que solo descuente inventario, y dejaría create como el orquestador que llama a esas piezas en orden. Eso se alinea con el principio de responsabilidad única y además hace mucho más fácil escribir tests unitarios de cada parte por separado en vez de tener que pasar siempre por el flujo completo.

También movería los mensajes de error que ahora están escritos directo dentro de cada throw a un lugar centralizado, para no repetir strings ni tener que buscarlos uno por uno si algún día hay que cambiar el tono o traducir la API.

En el frontend, el flujo de crear y confirmar la orden está resuelto con dos mutaciones separadas coordinadas por un useEffect que reacciona cuando cambia el id de la orden creada. Funciona bien, pero es un patrón un poco implícito de seguir. Con más tiempo lo cambiaría por una sola función asíncrona que primero cree la orden y después, con ese resultado en la mano, confirme directamente, sin depender de un efecto secundario para encadenar los dos pasos.

Completaría los dos extras que quedaron pendientes, empezando por la reserva de quince minutos porque es la que más impacto tiene en que el inventario se comporte de forma realista, y después el refresco de disponibilidad durante el checkout para que el usuario se entere de un cambio de stock antes de intentar pagar y no después.

Por último, dejaría una revisión final del código antes de entregar, para borrar los comentarios TODO que ya no correspondían y reemplazarlos, donde hiciera falta, por comentarios puntuales que expliquen una decisión concreta, por ejemplo por qué la validación de inventario se hace en dos pasadas separadas antes de descontar el stock, en vez de dejar comentarios genéricos de instrucciones que ya se resolvieron.

## Cómo lo probé

Corrí pnpm --filter api test para confirmar que los tests del backend pasan, incluyendo los que agregué para el código de descuento. En el navegador probé el flujo completo de elegir entradas, pasar por el checkout, pagar y llegar a la confirmación, tanto con código de descuento como sin él, y también probé pedir más entradas de las que quedan disponibles para confirmar que el error se muestra en pantalla en vez de romper la aplicación.