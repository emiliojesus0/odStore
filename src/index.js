import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import indexRoutes from "./routes/index.js";
import session from "express-session";

const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));

app.set("views", join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(join(__dirname, "public")));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    secret: "mi_secreto_para_sesiones",
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: false } // Cambia a `true` si usas HTTPS
  })
);

app.use(indexRoutes);

export { __dirname };

app.listen(3000);
console.log("SERVIDOR ESTA ESCUCHANDO PUERTO 3000");
