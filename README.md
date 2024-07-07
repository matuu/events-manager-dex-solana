# events-manager-dex-solana
Final project of Heavy Duty Builder program Spanish edition, 2024

# Enunciado

### PROGRAMA DE ADMINISTRACIÓN DE EVENTOS EN SOLANA

El objetivo de este proyecto es desarrollar un ADMINISTRADOR DE EVENTOS DESCENTRALIZADO basado en la blockchain de Solana. Este administrador permitirá a los usuarios crear eventos, 
participar como colaboradores, vender entradas y distribuir las ganancias obtenidas al finalizar el evento.
Estos eventos dependerán de la colaboración de los usuarios para llevarse a cabo, ya que los fondos necesarios para su organización, se obtendrán de la venta de Tokens del Evento 
que los usuarios adquieran a manera de colaboradores. Aquellos usuarios colaboradores del evento recibirán parte de las ganancias que se genere con la venta de entradas.
Estos tokens tendrán un valor 1:1 de una moneda específica asignada al momento de crear el evento, que actuará como Moneda Aceptada en todas las transacciones. 
Las ganancias obtenidas de los Tokens del Evento se depositarán en una Bóveda de Tesorería. El organizador podrá retirar fondos de la Bóveda de Tesorería para cubrir los gastos referentes
al evento.


### ESTRUCTURA DE UN EVENTO

La estructura del evento estará definida por los datos básicos del evento y las cuentas necesarias para realizar las transacciones:

```
Event {
 // datos básicos
 name,
 ticket_price,
 is_active,
 ...
 // cuentas
 accepted_mint,
 authority,
}
```

Cada evento pondrá a la venta una cantidad de entradas con un valor definido al momento de
crear el evento. Las ganancias obtenidas de la venta de las entradas se depositarán en una
Bóveda de Ganancias.
Al finalizar el evento, cada colaborador podrá retirar el monto que le corresponde de la
Bóveda de Ganancias, valor que se calcula de forma proporcional a la cantidad de Tokens del
Evento adquiridos por cada colaborador.


### DESCRIPCIÓN DEL PROGRAMA

El administrador de eventos está compuesto por seis (6) instrucciones principales que
describen el flujo de trabajo del sistema:

- create_event: Crea un nuevo evento en la blockchain.

  Atributos:
    name: Nombre del evento.

- ticket_price: Precio de la entrada del evento expresado en la Moneda Aceptada.

- buy_tokens: Transfiere el valor del precio del Token del Evento a la Bóveda de Tesorería y hace mint de los Tokens del Evento a la cuenta del colaborador.

  Atributos:
    quantity: Cantidad de Tokens del Evento que adquiere el colaborador.

- buy_tickets: Transfiere el valor del precio de la entrada del evento a la Bóveda de Ganancias.

  Atributos:
    quantity: Cantidad de entradas que compra el usuario.
  
- close_event: Actualiza los datos del event para indicar que ya no está activo.
  
- withdraw_earnings: Transfiere fondos desde la Bóveda de Ganancias a la cuenta del colaborador que solicita el retiro.

### DETALLES DE LA ENTREGA

EL proyecto se trabajará en parejas, no dudes en utilizar los canales de discord para ayudarte a conformar tu equipo.
Se debe desarrollar el administrador de eventos utilizando el lenguaje de programación Rust y el framework Anchor.
Utilice Github para almacenar y trabajar en el proyecto. 
La fecha de entrega será el día miércoles 10 de julio.


# Tareas

1. crear un evento
2. participación como colaborador
3. vender entradas
4. distribuir ganancias (entre colaboradores)
5. retirar fondos de la tesorería.

Implica:

- tokens del evento: participar como colaborador: comprar token del evento
- moneda aceptada: 1:1 con el token del evento
- token account: boveda de tesorería
- token account: boveda de ganancias (moneda aceptada)
