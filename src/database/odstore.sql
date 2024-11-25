create DATABASE odstore;

use odstore;
create table usuario(
	cedula varchar(10) primary key,
	tipo varchar(50),
	nombre varchar(50),
	apellido varchar(50),
	password varchar(50),
	correo varchar(50),
	estado int(1)
);

create table productos(
	id INT AUTO_INCREMENT PRIMARY KEY,
	nombre varchar(50),
	categoria varchar(50),
	descripcion varchar(500),
	precio double,
	stock int,
	estado int	
);

create table clientes(
	cedula varchar(10) primary key,
	nombre varchar(50),
	apellido varchar(50),
	correo varchar(50),
	celular varchar(15),
	estado int	
);

create table pedidos(
	id int AUTO_INCREMENT primary key,
	idcliente varchar(50),
	fecha date,
	estadopedido varchar(50),
	direccion varchar(200),
	formapago varchar (50),

	FOREIGN KEY (idcliente) REFERENCES clientes(cedula)

);

create table detallepedido(
	iddetalle int AUTO_INCREMENT primary key,
	idpedido int,
	idproducto int,
	cantidad int,
	preciouni double,
	preciototal double,

	FOREIGN KEY (idpedido) REFERENCES pedidos(id),
	FOREIGN KEY (idproducto) REFERENCES productos(id)

);

alter table productos add imagen varchar(100);
