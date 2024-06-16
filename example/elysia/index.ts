import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia().use(await autoload());

app.listen(3222, () => console.log(app.routes));

export type App = typeof app;
