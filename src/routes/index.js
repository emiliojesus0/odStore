import { Router } from "express";
import pool from "../database.js";
import { __dirname } from "../index.js";
import { join } from "path";
import path from "path";
import multer from "multer";

const router = Router();

//***************************** */

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, "public/img/productos")); // Carpeta de destino
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renombrar el archivo
  },
});

const upload = multer({ storage: storage });
//***************************** */

// Configuración de Multer
const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, "public/img/transferencias")); // Carpeta de destino
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renombrar el archivo
  },
});

const upload2 = multer({ storage: storage2 });
//***************************** */

//router.get("/", (req, res) => res.render("index"));
router.get("/contact", (req, res) => {
  if (req.session.loggedin) {
    res.render("viewsadmin/indexadmin");
  } else {
    res.render("contact");
  }
});

router.get("/about", (req, res) => {
  if (req.session.loggedin) {
    res.render("viewsadmin/indexadmin");
  } else {
    res.render("about");
  }
});

//router.get("/carrito", (req, res) => res.render("carrito"));
router.get("/carrito", (req, res) => {
  if (req.session.loggedin) {
    res.render("viewsadmin/indexadmin");
  } else {
    const carrito = req.session.carrito || [];

    // Renderizar la página del carrito y pasar los productos seleccionados
    res.render("carrito", { carrito });
  }
});

router.post("/submit", upload2.single("imagen"), async (req, res) => {
  try {
    if (req.session.loggedin) {
      res.render("viewsadmin/indexadmin");
    } else {
      const data = req.body; // Captura el valor de búsqueda desde el query string
      const [cliente] = await pool.query(
        "SELECT * FROM clientes where cedula=?",
        data.cedula
      );
      if (cliente.length === 0) {
        await pool.query(
          "insert into clientes (cedula,nombre,apellido,correo,celular,estado) values (?,?,?,?,?,1);",
          [data.cedula, data.nombre, data.apellido, data.correo, data.celular]
        );
      }
      if (req.body.pago === "transferencia") {
        await pool.query(
          "insert into pedidos (idcliente,fecha,estadopedido,direccion,formapago,imagentrans) values (?,?,'Pendiente',?,?,?);",
          [
            data.cedula,
            data.fecha,
            data.direccion,
            data.pago,
            req.file.filename,
          ]
        );
      } else {
        await pool.query(
          "insert into pedidos (idcliente,fecha,estadopedido,direccion,formapago) values (?,?,'Pendiente',?,?);",
          [data.cedula, data.fecha, data.direccion, data.pago]
        );
      }

      const [idf] = await pool.query("SELECT LAST_INSERT_ID() AS lastId");
      const [pedido] = await pool.query(
        "SELECT * FROM pedidos where id=?",
        idf[0].lastId
      );

      for (let i = 0; i < data.idproducto.length; i++) {
        await pool.query(
          "insert into detallepedido (idpedido,idproducto,cantidad,preciouni,preciototal) values (?,?,?,?,?);",
          [
            idf[0].lastId,
            data.idproducto[i], // id del producto
            data.cantidad[i], // cantidad del producto
            data.preciouni[i], // precio unitario del producto
            data.preciototal[i], // precio total del producto
          ]
        );
      }

      if (req.session.carrito) {
        req.session.destroy((err) => {
          if (err) {
            console.log("Error al destruir la sesión: ", err);
          } else {
            console.log("Sesión destruida.");
          }
        });
      }

      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (error) {
    console.error(error);
    res.send("Error en la búsqueda");
  }
});

router.post("/addcarrito", async (req, res) => {
  try {
    if (req.session.loggedin) {
      res.render("viewsadmin/indexadmin");
    } else {
      const data = req.body;
      // Verificar si el carrito ya existe en la sesión
      if (!req.session.carrito) {
        req.session.carrito = [];
      }

      // Añadir el nuevo producto al carrito
      req.session.carrito.push({
        nombre: data.nombre,
        precio: data.precio,
        cantidad: data.cantidad,
        imagen: data.imagen,
        id: data.id,
      });

      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/remover-producto/:index", (req, res) => {
  if (req.session.loggedin) {
    res.render("viewsadmin/indexadmin");
  } else {
    const index = req.params.index;

    // Verificar si el carrito existe en la sesión
    if (req.session.carrito) {
      // Remover el producto del carrito usando el índice
      req.session.carrito.splice(index, 1); // Elimina 1 elemento en el índice dado
    }

    // Redirigir nuevamente a la página del carrito
    res.redirect("/carrito");
  }
});

router.get("/", async (req, res) => {
  try {
    if (req.session.loggedin) {
      res.render("viewsadmin/indexadmin");
    } else {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/buscar", async (req, res) => {
  try {
    if (req.session.loggedin) {
      res.render("viewsadmin/indexadmin");
    } else {
      const { buscar } = req.query; // Captura el valor de búsqueda desde el query string
      const [result] = await pool.query(
        "SELECT * FROM productos WHERE nombre LIKE ? AND estado = 1",
        [`%${buscar}%`]
      );
      res.render("index", { result });
    }
  } catch (error) {
    console.error(error);
    res.send("Error en la búsqueda");
  }
});

//**************VISTAS ADMINISTRADOR********************

function login(link, req, res, tipo, datos) {
  if (req.session.loggedin) {
    if (tipo == req.session.name) {
      if (datos) {
        res.render(link, { result: datos });

        console.log("SI HAY DATOS");
      } else {
        res.render(link);
        console.log("NO HAY DATOS");
      }
    } else {
      res.redirect("/" + req.session.name);
    }
  } else {
    res.render("login.ejs", { message: null });
  }
}

router.get("/login", async (req, res) => {
  try {
    if (req.session.loggedin) {
      res.render("viewsadmin/indexadmin");
    } else {
      res.render("login", { message: null });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/indexadmin", async (req, res) => {
  try {
    if (req.session.loggedin) {
      const [result1] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("viewsadmin/indexadmin", { result1 });
    } else {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/cerrarsesion", (req, res) => {
  if (req.session.loggedin == true) {
    req.session.destroy();
  }
  res.redirect("/");
});

router.post("/auth", async (req, res) => {
  const data = req.body;
  try {
    const [result] = await pool.query(
      "SELECT * FROM usuario WHERE cedula = ? AND estado = 1",
      [data.usuario]
    );

    if (result.length > 0) {
      console.log("si hay un perfil");
      if (data.password == result[0].password) {
        req.session.loggedin = true;
        req.session.name = result.tipo;

        const [result1] = await pool.query(
          "SELECT * FROM productos where estado = 1"
        );
        res.render("viewsadmin/indexadmin", { result1 });

        console.log("SESION INICIADA");
      } else {
        res.render("login", {
          message: "ERROR: CONTRASEÑA INCORRECTA",
        });
        console.log("CONTRASEÑA INCORRECTA");
      }
    } else {
      console.log("no hay un perfil");
      res.render("login", { message: "ERROR: USUARIO NO EXISTE" });
    }
  } catch (error) {
    console.error(error);
    res.send("Error en la búsqueda");
  }
});

router.get("/productosadmin", async (req, res) => {
  try {
    if (req.session.loggedin) {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("viewsadmin/productosadmin", { result });
    } else {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/addproduct", upload.single("imagen"), async (req, res) => {
  try {
    if (req.session.loggedin) {
      const data = req.body;

      await pool.query(
        "insert into productos (nombre,categoria,descripcion,precio,stock,imagen,estado) values (?,?,?,?,?,?,1)",
        [
          data.nombre,
          data.categoria,
          data.descripcion,
          data.precio,
          data.stock,
          req.file.filename,
          ,
        ]
      );

      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("viewsadmin/productosadmin", { result });
    } else {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/remover-productoadmin/:id", async (req, res) => {
  try {
    if (req.session.loggedin) {
      const id = req.params.id;
      await pool.query("UPDATE productos set estado = 0 WHERE id=?", [id]);

      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("viewsadmin/productosadmin", { result });
    } else {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (error) {
    console.error(error);
    res.send("Error en la búsqueda");
  }
});

router.post("/update-productoadmin", async (req, res) => {
  try {
    if (req.session.loggedin) {
      const data = req.body;
      await pool.query(
        "UPDATE productos set nombre=?,categoria=?,descripcion=?, precio=?,stock=? WHERE id=?",
        [
          data.nombre,
          data.categoria,
          data.descripcion,
          data.precio,
          data.stock,
          data.id,
        ]
      );
      console.log(data);
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("viewsadmin/productosadmin", { result });
    } else {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (error) {
    console.error(error);
    res.send("Error en la búsqueda");
  }
});
router.get("/pedidosadmin", async (req, res) => {
  try {
    if (req.session.loggedin) {
      const [result] = await pool.query("SELECT * FROM pedidos");
      const [result1] = await pool.query(
        "SELECT ped.id, p.imagen ,p.nombre , dp.cantidad , dp.preciouni , dp.preciototal FROM detallepedido dp JOIN productos p ON dp.idproducto = p.id JOIN pedidos ped ON dp.idpedido = ped.id"
      );

      // Formatear las fechas
      const pedidosFormateados = result.map((pedido) => {
        const fechaFormateada = new Intl.DateTimeFormat("es-EC", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(pedido.fecha));

        return {
          ...pedido,
          fecha: fechaFormateada, // Reemplaza la fecha original con la formateada
        };
      });
      res.render("viewsadmin/pedidosadmin", {
        result: pedidosFormateados,
        result1, // Convertir a JSON para enviarlo al cliente
      });
    } else {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/clientesadmin", async (req, res) => {
  try {
    if (req.session.loggedin) {
      const [result] = await pool.query("SELECT * FROM clientes");
      res.render("viewsadmin/clientesadmin", { result });
    } else {
      const [result] = await pool.query(
        "SELECT * FROM productos where estado = 1"
      );
      res.render("index", { result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;
